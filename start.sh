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

echo "============================================================"
echo "[MovieFlix] Checking dependencies & build on NuraHost Linux..."
echo "[MovieFlix] Port: $PORT | Host: $HOSTNAME"
echo "============================================================"

# 1. Enable Corepack & pnpm if not available
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable 2>/dev/null || npm install -g pnpm 2>/dev/null || true
fi

# 2. Install dependencies if node_modules is missing
if [ ! -d "$ROOT/node_modules" ]; then
  echo "[MovieFlix] node_modules not found. Running pnpm install..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile
  else
    npm install --legacy-peer-deps
  fi
fi

# 3. Generate Prisma client
echo "[MovieFlix] Ensuring Prisma Client is generated..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prisma generate
else
  npx prisma generate
fi

# 4. Build Next.js if .next is missing or rebuilt
if [ ! -d "$ROOT/.next" ]; then
  echo "[MovieFlix] .next build not found. Running build..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm build
  else
    npm run build
  fi
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
  if command -v pnpm >/dev/null 2>&1; then
    exec pnpm start
  else
    exec npm start
  fi
fi
