#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Ensure environment file is available
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
echo "[MovieFlix] Checking dependencies & build on NuraHost Linux..."
echo "[MovieFlix] Port: $PORT | Host: $HOSTNAME"
echo "============================================================"

# 1. Setup local user-space bin directory for pnpm (avoiding EROFS on /usr/local/bin)
export PATH="$ROOT/.local/bin:$PATH"
mkdir -p "$ROOT/.local/bin"

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable --install-directory "$ROOT/.local/bin" 2>/dev/null || true
  fi
fi

# Determine package manager command
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

echo "[MovieFlix] Using package manager: $PM"

# 2. Install dependencies if node_modules is missing or package.json changed
PKG_HASH=$(md5sum "$ROOT/package.json" 2>/dev/null | cut -d' ' -f1 || cksum "$ROOT/package.json" 2>/dev/null | cut -d' ' -f1 || echo "default")
if [ ! -d "$ROOT/node_modules" ] || [ ! -f "$ROOT/node_modules/.pkg-hash" ] || [ "$(cat "$ROOT/node_modules/.pkg-hash" 2>/dev/null)" != "$PKG_HASH" ]; then
  echo "[MovieFlix] Installing / updating dependencies..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM install --frozen-lockfile || $PM install --no-frozen-lockfile
  else
    npm install --legacy-peer-deps
  fi
  echo "$PKG_HASH" > "$ROOT/node_modules/.pkg-hash" 2>/dev/null || true
else
  echo "[MovieFlix] Dependencies are up to date."
fi

# 3. Generate Prisma client
echo "[MovieFlix] Generating Prisma Client..."
if [[ "$PM" == *"pnpm"* ]]; then
  $PM exec prisma generate
else
  npx prisma generate
fi

# 4. Build Next.js if .next is missing or new release detected
REBUILD_NEEDED=false
if [ ! -d "$ROOT/.next" ]; then
  REBUILD_NEEDED=true
elif [ -f "$ROOT/.release-marker" ]; then
  if [ ! -f "$ROOT/.next/.release-marker" ] || ! cmp -s "$ROOT/.release-marker" "$ROOT/.next/.release-marker"; then
    echo "[MovieFlix] New release detected! Rebuilding application..."
    REBUILD_NEEDED=true
  fi
fi

if [ "$REBUILD_NEEDED" = true ]; then
  echo "[MovieFlix] Building application..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM build
  else
    npm run build
  fi
  if [ -f "$ROOT/.release-marker" ]; then
    cp "$ROOT/.release-marker" "$ROOT/.next/.release-marker" 2>/dev/null || true
  fi
else
  echo "[MovieFlix] Build is already up to date."
fi

echo "============================================================"
echo "[MovieFlix] Starting Server..."
echo "============================================================"

# Prefer Next.js standalone if available, otherwise next start
if [ -f "$ROOT/.next/standalone/server.js" ]; then
  # Ensure static files and public directory are in standalone
  mkdir -p "$ROOT/.next/standalone/.next"
  cp -R "$ROOT/.next/static" "$ROOT/.next/standalone/.next/static" 2>/dev/null || true
  cp -R "$ROOT/public" "$ROOT/.next/standalone/public" 2>/dev/null || true
  cd "$ROOT/.next/standalone"
  if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    exec node --env-file="$ENV_FILE" server.js
  else
    exec node server.js
  fi
else
  if [[ "$PM" == *"pnpm"* ]]; then
    exec $PM start
  else
    exec npm start
  fi
fi
