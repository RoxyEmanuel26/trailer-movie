#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
RELEASES="$ROOT/releases"
SHARED="$ROOT/shared"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/RoxyEmanuel26/trailer-movie.git}"
SHA="${DEPLOY_COMMIT_SHA:-}"

if [[ ! "$SHA" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
  echo "DEPLOY_COMMIT_SHA must be the exact CI-approved Git commit SHA." >&2
  exit 1
fi
if [[ ! -f "$SHARED/.env.production.local" ]]; then
  echo "Missing $SHARED/.env.production.local" >&2
  exit 1
fi

mkdir -p "$RELEASES" "$SHARED/sitemaps"
TARGET="$RELEASES/$SHA"
if [[ -f "$TARGET/.release-ready" ]]; then
  echo "Release $SHA is already built."
  exit 0
fi
if [[ -e "$TARGET" ]]; then
  echo "Incomplete release directory already exists: $TARGET" >&2
  exit 1
fi

git init "$TARGET"
git -C "$TARGET" remote add origin "$REPOSITORY_URL"
git -C "$TARGET" fetch --depth 1 origin "$SHA"
git -C "$TARGET" checkout --detach FETCH_HEAD
cp "$SHARED/.env.production.local" "$TARGET/.env.production.local"

cd "$TARGET"
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export APP_RELEASE_SHA="$SHA"
export SITEMAP_CACHE_DIR="${SITEMAP_CACHE_DIR:-$SHARED/sitemaps}"

corepack enable
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm build
pnpm exec tsx scripts/warm-sitemap-cache.ts

mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
cp "$SHARED/.env.production.local" .next/standalone/.env.production.local
printf '%s\n' "$SHA" > .release-ready
echo "Release $SHA prepared successfully."
