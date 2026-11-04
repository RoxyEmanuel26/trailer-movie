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

# 1. Install dependencies only if node_modules is missing on server
if [ ! -d "$ROOT/node_modules" ]; then
  echo "[MovieFlix] node_modules not found. Installing dependencies..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM install --frozen-lockfile || $PM install --no-frozen-lockfile
  else
    npm install --legacy-peer-deps
  fi
else
  echo "[MovieFlix] node_modules found. Skipping installation."
fi

# 2. Check Prisma Client
if [ ! -d "$ROOT/node_modules/.prisma" ] && [ ! -d "$ROOT/node_modules/@prisma/client" ]; then
  echo "[MovieFlix] Generating Prisma Client..."
  if [[ "$PM" == *"pnpm"* ]]; then
    $PM exec prisma generate
  else
    npx prisma generate
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

echo "============================================================"
echo "[MovieFlix] Launching Next.js Production Server..."
echo "============================================================"

if [ -f "$ROOT/node_modules/next/dist/bin/next" ]; then
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
