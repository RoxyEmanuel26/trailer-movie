#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
RELEASES="$ROOT/releases"
SHARED="$ROOT/shared"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/RoxyEmanuel26/trailer-movie.git}"
SHA="${DEPLOY_COMMIT_SHA:-}"
if [[ -z "$SHA" && -f "$SHARED/release-sha.txt" ]]; then
  SHA="$(tr -d '[:space:]' < "$SHARED/release-sha.txt")"
fi

if [[ ! "$SHA" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
  echo "DEPLOY_COMMIT_SHA or $SHARED/release-sha.txt must contain the exact Git commit SHA." >&2
  exit 1
fi
if [[ ! -f "$SHARED/.env.production.local" ]]; then
  echo "Missing $SHARED/.env.production.local" >&2
  exit 1
fi

ENV_FILE="$SHARED/.env.production.local" DB_FALLBACK_HOST="${DB_FALLBACK_HOST:-nano-1.nura.host}" node - <<'NODE'
const fs = require('node:fs');
const net = require('node:net');
const util = require('node:util');

const envPath = process.env.ENV_FILE;
const fallbackHost = process.env.DB_FALLBACK_HOST || 'nano-1.nura.host';
const raw = fs.readFileSync(envPath, 'utf8');
const parsed = util.parseEnv(raw);
if (!parsed.DATABASE_URL) process.exit(0);

let dbUrl;
try {
  dbUrl = new URL(parsed.DATABASE_URL);
} catch {
  process.exit(0);
}

const probe = (host, port) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port: Number(port || 5432) });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });

(async () => {
  const host = dbUrl.hostname;
  const port = dbUrl.port || '5432';
  if (await probe(host, port)) {
    console.log(`[MovieFlix] PostgreSQL reachable at ${host}:${port}`);
    return;
  }
  if (host.endsWith('.pterodactyl_nw') && (await probe(fallbackHost, port))) {
    const updated = raw.split(host).join(fallbackHost).replace(/\r\n/g, '\n');
    fs.writeFileSync(envPath, updated, 'utf8');
    console.log(`[MovieFlix] Isolated container network detected; switched DB host to ${fallbackHost}:${port}`);
    return;
  }
  console.warn(`[MovieFlix] Warning: PostgreSQL TCP probe did not connect to ${host}:${port}`);
})();
NODE

mkdir -p "$RELEASES" "$SHARED/sitemaps" "$ROOT/.local/bin" "$SHARED/.cache/corepack" "$SHARED/.pnpm-store"
export PATH="$ROOT/.local/bin:$PATH"
export CI=true
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export COREPACK_HOME="$SHARED/.cache/corepack"
export NPM_CONFIG_STORE_DIR="$SHARED/.pnpm-store"

TARGET="$RELEASES/$SHA"
if [[ -f "$TARGET/.release-ready" ]]; then
  echo "Release $SHA is already built."
  exit 0
fi
if [[ -e "$TARGET" ]]; then
  echo "Removing incomplete release directory: $TARGET"
  rm -rf -- "$TARGET"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable --install-directory "$ROOT/.local/bin"
fi

git init "$TARGET"
git -C "$TARGET" remote add origin "$REPOSITORY_URL"
git -C "$TARGET" fetch --depth 1 origin "$SHA"
git -C "$TARGET" checkout --detach FETCH_HEAD
cp "$SHARED/.env.production.local" "$TARGET/.env.production.local"

cd "$TARGET"
export NEXT_TELEMETRY_DISABLED=1
export APP_RELEASE_SHA="$SHA"
export SITEMAP_CACHE_DIR="${SITEMAP_CACHE_DIR:-$SHARED/sitemaps}"

NODE_ENV=development pnpm install --frozen-lockfile --prod=false
export NODE_ENV=production
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm build
pnpm exec tsx --env-file=.env.production.local scripts/warm-sitemap-cache.ts

mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
cp "$SHARED/.env.production.local" .next/standalone/.env.production.local
printf '%s\n' "$SHA" > .release-ready
echo "Release $SHA prepared successfully."
