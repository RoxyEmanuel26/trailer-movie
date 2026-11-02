#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
RELEASES="$ROOT/releases"
SHARED="$ROOT/shared"

if [[ -f "$SHARED/env.production" ]]; then
  cp -f "$SHARED/env.production" "$SHARED/.env.production.local"
fi

SHA="${DEPLOY_COMMIT_SHA:-}"
if [[ -z "$SHA" && -f "$SHARED/release-sha.txt" ]]; then
  SHA="$(tr -d '[:space:]' < "$SHARED/release-sha.txt")"
fi

if [[ ! "$SHA" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
  echo "DEPLOY_COMMIT_SHA or $SHARED/release-sha.txt must contain the exact Git commit SHA." >&2
  exit 1
fi

TARGET="$RELEASES/$SHA"
CURRENT="$ROOT/current"

chmod 600 "$SHARED/.env.production.local" 2>/dev/null || true
chmod +x "$(dirname "$0")"/*.sh 2>/dev/null || true

# Auto-sync latest prepare-release.sh from GitHub if reachable
if command -v curl >/dev/null 2>&1; then
  curl -sSfL "https://raw.githubusercontent.com/RoxyEmanuel26/trailer-movie/main/deploy/pterodactyl/prepare-release.sh" -o "$(dirname "$0")/prepare-release.sh.new" 2>/dev/null && \
  [[ -s "$(dirname "$0")/prepare-release.sh.new" ]] && \
  mv -f "$(dirname "$0")/prepare-release.sh.new" "$(dirname "$0")/prepare-release.sh" && \
  chmod +x "$(dirname "$0")/prepare-release.sh" 2>/dev/null || rm -f "$(dirname "$0")/prepare-release.sh.new"
fi

bash "$(dirname "$0")/prepare-release.sh"

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
cp -f "$SHARED/.env.production.local" "$CURRENT/.next/standalone/.env.production.local"

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
export PORT="${SERVER_PORT:-${PORT:-5060}}"
export APP_RELEASE_SHA="$SHA"
export SITEMAP_CACHE_DIR="${SITEMAP_CACHE_DIR:-$SHARED/sitemaps}"
CONTAINER_HOST="$(hostname 2>/dev/null || echo 'unknown')"
echo "============================================================"
echo "[MovieFlix] Active release           : $SHA"
echo "[MovieFlix] Container hostname       : $CONTAINER_HOST"
echo "[MovieFlix] Listening address        : 0.0.0.0:$PORT"
echo "[MovieFlix] Tunnel target (internal) : http://$CONTAINER_HOST:$PORT"
echo "[MovieFlix] Tunnel target (fallback) : http://nano-1.nura.host:$PORT"
echo "============================================================"
cd "$CURRENT/.next/standalone"
exec node --env-file=.env.production.local server.js
