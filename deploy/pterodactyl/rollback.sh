#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
PREVIOUS="$ROOT/previous"
if [[ ! -L "$PREVIOUS" ]] || [[ ! -f "$(readlink -f "$PREVIOUS")/.release-ready" ]]; then
  echo "No valid previous release is available." >&2
  exit 1
fi
TARGET="$(readlink -f "$PREVIOUS")"
ln -sfn "$TARGET" "$ROOT/current.next"
mv -Tf "$ROOT/current.next" "$ROOT/current"
echo "Rolled back to $(basename "$TARGET"). Restart the Pterodactyl server now."
