#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${MOVIEFLIX_ROOT:-/home/container}"
RELEASES="$ROOT/releases"
SHARED="$ROOT/shared"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/RoxyEmanuel26/trailer-movie.git}"

if [[ -f "$SHARED/env.production" ]]; then
  cp -f "$SHARED/env.production" "$SHARED/.env.production.local"
  chmod 600 "$SHARED/.env.production.local" 2>/dev/null || true
fi

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
const dns = require('node:dns').promises;
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const util = require('node:util');

const envPath = process.env.ENV_FILE;
const fallbackHost = process.env.DB_FALLBACK_HOST || 'nano-1.nura.host';
const defaultInternalHost = '461b710f-642a-4ea8-af0a-668edcfa5d6a.pterodactyl_nw';
const shortInternalHost = '461b710f-642a-4ea8-af0a-668edcfa5d6a';

let raw = fs.readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n');
const parsed = util.parseEnv(raw);
if (!parsed.DATABASE_URL) process.exit(0);

let dbUrl;
try {
  dbUrl = new URL(parsed.DATABASE_URL);
} catch {
  process.exit(0);
}

const PG_SSL_REQUEST = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]);

const probePg = (host, port, timeoutMs = 3500) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port: Number(port) });
    let settled = false;
    const done = (ok, detail) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ok, host, port: String(port), detail });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.write(PG_SSL_REQUEST);
    });
    socket.once('data', (buf) => {
      const ch = buf.toString('ascii', 0, 1);
      if (ch === 'N' || ch === 'S' || buf.length > 0) {
        done(true, `pg-reply=${ch}`);
      } else {
        done(false, 'empty-reply');
      }
    });
    socket.once('timeout', () => done(false, 'TIMEOUT'));
    socket.once('error', (err) => done(false, err.code || err.message));
  });

function getLinuxGatewayIp() {
  try {
    const route = fs.readFileSync('/proc/net/route', 'utf8');
    const match = route.match(/^\S+\s+00000000\s+([0-9A-Fa-f]{8})\b/m);
    if (!match) return null;
    return [6, 4, 2, 0].map((i) => parseInt(match[1].slice(i, i + 2), 16)).join('.');
  } catch {
    return null;
  }
}

function getContainerIpv4Subnets() {
  const prefixes = new Set();
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) {
        const parts = info.address.split('.');
        if (parts.length === 4) prefixes.add(parts.slice(0, 3).join('.'));
      }
    }
  }
  return [...prefixes];
}

function rewriteEnvDbTarget(content, newHost, newPort) {
  return content.replace(
    /^((?:DIRECT_)?DATABASE_URL=["']?postgresql:\/\/[^@]+@)([^:/?"']+)(?::(\d+))?(\/[^"'\n]*["']?)$/gm,
    `$1${newHost}:${newPort}$4`,
  );
}

(async () => {
  const configuredPort = dbUrl.port || '5112';
  const gatewayIp = getLinuxGatewayIp();
  const candidates = [
    [fallbackHost, configuredPort],
    [dbUrl.hostname, configuredPort],
    [defaultInternalHost, configuredPort],
    [shortInternalHost, configuredPort],
    [defaultInternalHost, '5432'],
    [shortInternalHost, '5432'],
    ...(gatewayIp ? [[gatewayIp, configuredPort]] : []),
    ['172.18.0.1', configuredPort],
    ['172.17.0.1', configuredPort],
    ['host.docker.internal', configuredPort],
  ];

  const seen = new Set();
  for (const [h, p] of candidates) {
    const key = `${h}:${p}`;
    if (!h || seen.has(key)) continue;
    seen.add(key);
    const res = await probePg(h, p, 3500);
    console.log(`[MovieFlix DB Probe] ${key} -> ${res.ok ? 'CONNECTED (' + res.detail + ')' : 'FAILED (' + res.detail + ')'}`);
    if (res.ok) {
      const updated = rewriteEnvDbTarget(raw, h, p);
      fs.writeFileSync(envPath, updated, 'utf8');
      const mirrorPath = envPath.replace('.env.production.local', 'env.production');
      if (fs.existsSync(mirrorPath)) fs.writeFileSync(mirrorPath, updated, 'utf8');
      console.log(`[MovieFlix] Selected working PostgreSQL endpoint: ${key}`);
      return;
    }
  }

  const prefixes = getContainerIpv4Subnets();
  for (const prefix of prefixes) {
    for (const scanPort of [configuredPort, '5432']) {
      console.log(`[MovieFlix DB Probe] Scanning container subnet ${prefix}.1..254:${scanPort} ...`);
      const ips = Array.from({ length: 254 }, (_, idx) => `${prefix}.${idx + 1}`);
      for (let i = 0; i < ips.length; i += 64) {
        const batch = ips.slice(i, i + 64);
        const results = await Promise.all(batch.map((ip) => probePg(ip, scanPort, 800)));
        const hit = results.find((r) => r.ok);
        if (hit) {
          const updated = rewriteEnvDbTarget(raw, hit.host, hit.port);
          fs.writeFileSync(envPath, updated, 'utf8');
          const mirrorPath = envPath.replace('.env.production.local', 'env.production');
          if (fs.existsSync(mirrorPath)) fs.writeFileSync(mirrorPath, updated, 'utf8');
          console.log(`[MovieFlix] Discovered PostgreSQL on container subnet at ${hit.host}:${hit.port} (${hit.detail})`);
          return;
        }
      }
    }
  }

  const dnsInfo = await dns.lookup(defaultInternalHost, { all: true }).catch((e) => e.code || e.message);
  console.warn(`[MovieFlix] Warning: No PostgreSQL candidate responded. DNS(${defaultInternalHost})=${JSON.stringify(dnsInfo)} gateway=${gatewayIp}`);
})();
NODE

mkdir -p "$RELEASES" "$SHARED/sitemaps" "$ROOT/.local/bin" "$SHARED/.cache/corepack" "$SHARED/.pnpm-store"
export PATH="$ROOT/.local/bin:$PATH"
export CI=true
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export COREPACK_HOME="$SHARED/.cache/corepack"

TARGET="$RELEASES/$SHA"
if [[ -f "$TARGET/.release-ready" ]]; then
  echo "Release $SHA is already built."
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable --install-directory "$ROOT/.local/bin"
fi

if [[ ! -d "$TARGET/.git" ]]; then
  rm -rf -- "$TARGET"
  git init "$TARGET"
  git -C "$TARGET" remote add origin "$REPOSITORY_URL"
  git -C "$TARGET" fetch --depth 1 origin "$SHA"
  git -C "$TARGET" checkout --detach FETCH_HEAD
else
  echo "[MovieFlix] Reusing existing Git checkout in $TARGET"
fi

cp -f "$SHARED/.env.production.local" "$TARGET/.env.production.local"

cd "$TARGET"
export NEXT_TELEMETRY_DISABLED=1
export APP_RELEASE_SHA="$SHA"
export SITEMAP_CACHE_DIR="${SITEMAP_CACHE_DIR:-$SHARED/sitemaps}"

if [[ ! -f "$TARGET/node_modules/.modules.yaml" ]]; then
  PREV_RELEASE=""
  if [[ -L "$ROOT/current" && -f "$ROOT/current/node_modules/.modules.yaml" ]]; then
    PREV_RELEASE="$(readlink -f "$ROOT/current")"
  elif [[ -L "$ROOT/previous" && -f "$ROOT/previous/node_modules/.modules.yaml" ]]; then
    PREV_RELEASE="$(readlink -f "$ROOT/previous")"
  fi

  if [[ -n "$PREV_RELEASE" && -f "$PREV_RELEASE/pnpm-lock.yaml" ]] && cmp -s "$TARGET/pnpm-lock.yaml" "$PREV_RELEASE/pnpm-lock.yaml"; then
    echo "[MovieFlix] Dependencies unchanged. Fast-linking node_modules from active release ($PREV_RELEASE)..."
    cp -al "$PREV_RELEASE/node_modules" "$TARGET/node_modules" 2>/dev/null || cp -R "$PREV_RELEASE/node_modules" "$TARGET/node_modules"
    pnpm exec prisma generate
  else
    echo "[MovieFlix] Installing dependencies with pnpm (using cached store)..."
    NODE_ENV=development pnpm install --frozen-lockfile --prod=false --store-dir "$SHARED/.pnpm-store"
    pnpm exec prisma generate
  fi
else
  echo "[MovieFlix] Reusing existing node_modules in $TARGET"
  if [[ ! -d "$TARGET/node_modules/@prisma/client" ]]; then
    pnpm exec prisma generate
  fi
fi

if [[ ! -d "$TARGET/.next/cache" ]]; then
  if [[ -L "$ROOT/current" && -d "$ROOT/current/.next/cache" ]]; then
    echo "[MovieFlix] Fast incremental build: Seeding Next.js compiler cache from current release..."
    mkdir -p "$TARGET/.next"
    cp -al "$ROOT/current/.next/cache" "$TARGET/.next/cache" 2>/dev/null || cp -R "$ROOT/current/.next/cache" "$TARGET/.next/cache" 2>/dev/null || true
  fi
fi

export NODE_ENV=production
pnpm exec prisma migrate deploy
pnpm build
pnpm exec tsx --env-file=.env.production.local scripts/warm-sitemap-cache.ts

mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
cp -f "$SHARED/.env.production.local" .next/standalone/.env.production.local
printf '%s\n' "$SHA" > .release-ready
echo "Release $SHA prepared successfully."
