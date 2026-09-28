#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
RELEASES="$ROOT/releases"
SHA="${DEPLOY_COMMIT_SHA:-}"
TARGET="$RELEASES/$SHA"
CURRENT="$ROOT/current"

"$(dirname "$0")/prepare-release.sh"

if [[ ! -f "$TARGET/.release-ready" ]]; then
  echo "Release $SHA is not ready." >&2
  exit 1
fi

if [[ -L "$CURRENT" ]]; then
  ACTIVE="$(readlink -f "$CURRENT")"
  if [[ "$ACTIVE" != "$TARGET" ]]; then
    ln -sfn "$ACTIVE" "$ROOT/previous"
  fi
fi
ln -sfn "$TARGET" "$ROOT/current.next"
mv -Tf "$ROOT/current.next" "$CURRENT"
cp "$ROOT/shared/.env.production.local" "$CURRENT/.next/standalone/.env.production.local"

KEEP_PREVIOUS=""
if [[ -L "$ROOT/previous" ]]; then KEEP_PREVIOUS="$(readlink -f "$ROOT/previous")"; fi
for RELEASE in "$ROOT"/releases/*; do
  [[ -d "$RELEASE" ]] || continue
  RESOLVED="$(readlink -f "$RELEASE")"
  if [[ "$RESOLVED" != "$TARGET" && "$RESOLVED" != "$KEEP_PREVIOUS" && "$RESOLVED" == "$RELEASES"/* ]]; then
    rm -rf -- "$RESOLVED"
  fi
done

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT="${SERVER_PORT:-${PORT:-3000}}"
export APP_RELEASE_SHA="$SHA"
export SITEMAP_CACHE_DIR="${SITEMAP_CACHE_DIR:-$ROOT/shared/sitemaps}"
cd "$CURRENT/.next/standalone"
exec node server.js
