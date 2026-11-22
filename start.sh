#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [ -f "$ROOT/.env.production.local" ]; then
  ENV_FILE="$ROOT/.env.production.local"
elif [ -f "$ROOT/.env" ]; then
  ENV_FILE="$ROOT/.env"
else
  ENV_FILE=""
fi

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT="${SERVER_PORT:-${PORT:-5060}}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export COREPACK_ENABLE_AUTO_PIN=0

echo "============================================================"
echo "[MovieFlix] Starting Server (Pre-built on PC)"
echo "[MovieFlix] Port: $PORT | Host: $HOSTNAME"
echo "============================================================"

# Ensure pnpm path
export PATH="$ROOT/.local/bin:$PATH"
mkdir -p "$ROOT/.local/bin"

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable --install-directory "$ROOT/.local/bin" 2>/dev/null || true
  fi
fi

if command -v pnpm >/dev/null 2>&1; then
  PM="pnpm"
elif [ -x "$ROOT/.local/bin/pnpm" ]; then
  PM="$ROOT/.local/bin/pnpm"
elif command -v corepack >/dev/null 2>&1; then
  PM="corepack pnpm"
elif command -v npx >/dev/null 2>&1; then
  PM="npx pnpm"
else
  PM="npm"
fi

# 0. Automatic Disk Cleanup (reclaim caches, orphaned chunks, and old deploy artifacts)
if command -v du >/dev/null 2>&1; then
  echo "[MovieFlix] Disk usage before cleanup: $(du -sh "$ROOT" 2>/dev/null | awk '{print $1}')"
fi

# Remove leftover upload archives if not manually deleted after Unarchive
rm -f "$ROOT/movieflix-deploy.tar.gz" "$ROOT/movieflix-source.tar.gz" 2>/dev/null || true

# Remove build/dev-only Next.js caches and stale fetch/image caches (never needed at runtime)
rm -rf \
  "$ROOT/.next/dev" \
  "$ROOT/.next/cache/turbopack" \
  "$ROOT/.next/cache/webpack" \
  "$ROOT/.next/cache/swc" \
  "$ROOT/.next/cache/fetch-cache" \
  "$ROOT/.next/cache/images" \
  "$ROOT/.next/node_modules" \
  2>/dev/null || true

# Remove legacy Pterodactyl multi-release directories if running standalone root server.js
if [ -f "$ROOT/server.js" ] && [ -d "$ROOT/.next/server" ]; then
  rm -rf \
    "$ROOT/releases" \
    "$ROOT/current" \
    "$ROOT/previous" \
    "$ROOT/shared/.pnpm-store" \
    "$ROOT/shared/.cache" \
    2>/dev/null || true
fi

# Prune orphaned .next/server and .next/static chunks left behind by previous Unarchive overwrites
if [ -s "$ROOT/.next/.movieflix-file-manifest" ] && command -v node >/dev/null 2>&1; then
  node -e '
    const fs = require("fs");
    const path = require("path");
    const nextDir = path.resolve("./.next");
    const manifestPath = path.join(nextDir, ".movieflix-file-manifest");
    const expected = new Set(
      fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    );
    if (expected.size === 0) process.exit(0);
    let removed = 0;
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          try {
            if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
          } catch {}
        } else if (entry.isFile()) {
          const rel = path.relative(nextDir, full).split(path.sep).join("/");
          if (!expected.has(rel)) {
            try { fs.unlinkSync(full); removed += 1; } catch {}
          }
        }
      }
    };
    walk(path.join(nextDir, "server"));
    walk(path.join(nextDir, "static"));
    if (removed > 0) console.log("[MovieFlix] Pruned " + removed + " orphaned .next build artifact(s).");
  ' 2>/dev/null || true
fi

# Prune obsolete sitemap snapshot versions (!= v4-*) and orphaned .tmp files
for SM_DIR in "$ROOT/.cache/sitemaps" "$ROOT/shared/sitemaps"; do
  if [ -d "$SM_DIR" ]; then
    find "$SM_DIR" -maxdepth 1 -type f -name '*.xml' ! -name 'v4-*' -delete 2>/dev/null || true
    find "$SM_DIR" -maxdepth 2 -type f -name '*.tmp' -delete 2>/dev/null || true
  fi
done

# Clear package manager download/metadata caches
rm -rf "$HOME/.cache/pnpm" "$HOME/.npm" "$ROOT/.npm" "$ROOT/.cache/pnpm" 2>/dev/null || true

# 1. Install production dependencies if node_modules is missing, pnpm-lock.yaml changed,
# core pinned runtime packages drifted, or devDependencies bloat is still installed
LOCK_HASH=""
if [ -f "$ROOT/pnpm-lock.yaml" ] && command -v sha256sum >/dev/null 2>&1; then
  LOCK_HASH="$(sha256sum "$ROOT/pnpm-lock.yaml" | awk '{print $1}')"
fi
PREV_LOCK_HASH=""
if [ -f "$ROOT/node_modules/.movieflix-lock-hash" ]; then
  PREV_LOCK_HASH="$(cat "$ROOT/node_modules/.movieflix-lock-hash" 2>/dev/null || true)"
fi

NEEDS_INSTALL=0
if [ ! -d "$ROOT/node_modules" ]; then
  NEEDS_INSTALL=1
elif [ -n "$LOCK_HASH" ] && [ -n "$PREV_LOCK_HASH" ] && [ "$LOCK_HASH" != "$PREV_LOCK_HASH" ]; then
  NEEDS_INSTALL=1
elif [ -d "$ROOT/node_modules/eslint" ] || [ -d "$ROOT/node_modules/typescript" ] || [ -d "$ROOT/node_modules/openai" ] || [ -d "$ROOT/node_modules/tsx" ]; then
  echo "[MovieFlix] Pruning devDependencies from production node_modules..."
  NEEDS_INSTALL=1
elif ! node -e '
  const fs = require("fs");
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
  for (const name of ["next", "better-auth"]) {
    const expected = String(pkg.dependencies?.[name] || "").replace(/^[^0-9]*/, "");
    const installed = JSON.parse(fs.readFileSync("./node_modules/" + name + "/package.json", "utf8")).version;
    if (expected && installed !== expected) process.exit(1);
  }
' >/dev/null 2>&1; then
  NEEDS_INSTALL=1
fi

if [ "$NEEDS_INSTALL" -eq 1 ]; then
  echo "[MovieFlix] Installing production dependencies (--prod)..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM install --prod --frozen-lockfile || $PM install --prod --no-frozen-lockfile
  else
    npm install --omit=dev --legacy-peer-deps
  fi
  if [ -n "$LOCK_HASH" ] && [ -d "$ROOT/node_modules" ]; then
    echo "$LOCK_HASH" > "$ROOT/node_modules/.movieflix-lock-hash" 2>/dev/null || true
  fi
else
  if [ -n "$LOCK_HASH" ] && [ -z "$PREV_LOCK_HASH" ] && [ -d "$ROOT/node_modules" ]; then
    echo "$LOCK_HASH" > "$ROOT/node_modules/.movieflix-lock-hash" 2>/dev/null || true
  fi
  echo "[MovieFlix] Production node_modules up to date. Skipping installation."
fi

# Reclaim pnpm content-addressable store & caches inside container quota.
# Safe because pnpm links files into node_modules/.pnpm via hardlinks/copies
# (never symlinks to the store), while Pterodactyl Wings double-counts hardlinks
# across node_modules and ~/.local/share/pnpm/store against the 3 GiB disk quota.
if [[ "$PM" == *"pnpm"* ]]; then
  $PM store prune 2>/dev/null || true
fi
rm -rf \
  "$HOME/.local/share/pnpm/store" \
  "$ROOT/.local/share/pnpm/store" \
  "$HOME/.pnpm-store" \
  "$ROOT/.pnpm-store" \
  "$HOME/.cache/pnpm" \
  "$HOME/.npm" \
  "$ROOT/.npm" \
  2>/dev/null || true

# 2. Check Prisma Client (regenerate & re-link after fresh install so client & symlink match schema)
if [ "$NEEDS_INSTALL" -eq 1 ] || [ ! -d "$ROOT/node_modules/.prisma/client" ]; then
  echo "[MovieFlix] Generating & linking Prisma Client..."
  rm -rf "$ROOT/node_modules/.prisma" 2>/dev/null || true
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM exec prisma generate || npx prisma generate || true
  else
    npx prisma generate || true
  fi
  if [ ! -d "$ROOT/node_modules/.prisma" ]; then
    PNPM_PRISMA="$(find "$ROOT/node_modules/.pnpm" -type d -name ".prisma" 2>/dev/null | head -n 1 || true)"
    if [ -n "$PNPM_PRISMA" ] && [ -d "$PNPM_PRISMA" ]; then
      ln -sfn "$PNPM_PRISMA" "$ROOT/node_modules/.prisma" 2>/dev/null || cp -r "$PNPM_PRISMA" "$ROOT/node_modules/.prisma" 2>/dev/null || true
    fi
  fi
fi

# 3. Check if .next was uploaded
if [ ! -d "$ROOT/.next/server" ]; then
  echo "[MovieFlix] .next not found. Running build..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM build
  else
    npm run build
  fi
else
  echo "[MovieFlix] Pre-built .next found. Skipping build!"
fi

if command -v du >/dev/null 2>&1; then
  echo "[MovieFlix] Disk usage after cleanup: $(du -sh "$ROOT" 2>/dev/null | awk '{print $1}')"
fi

echo "============================================================"
echo "[MovieFlix] Launching Next.js Production Server..."
echo "============================================================"

if [ -f "$ROOT/server.js" ]; then
  if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    exec node --env-file="$ENV_FILE" server.js
  else
    exec node server.js
  fi
elif [ -f "$ROOT/node_modules/next/dist/bin/next" ]; then
  if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    exec node --env-file="$ENV_FILE" ./node_modules/next/dist/bin/next start -p "$PORT" -H "$HOSTNAME"
  else
    exec node ./node_modules/next/dist/bin/next start -p "$PORT" -H "$HOSTNAME"
  fi
elif [[ "$PM" == *"pnpm"* ]]; then
  exec $PM start
else
  exec npm start
fi
