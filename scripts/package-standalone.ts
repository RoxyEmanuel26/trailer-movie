import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const STAGING_DIR = path.join(ROOT, '.deploy-staging');
const OUTPUT_ARCHIVE = path.join(ROOT, 'movieflix-deploy.tar.gz');

function log(msg: string) {
  console.log(`\x1b[36m[Deploy Pack]\x1b[0m ${msg}`);
}

function copyRecursiveSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  log('Step 1/4: Checking Next.js pre-compiled production build...');
  if (!fs.existsSync(path.join(ROOT, '.next', 'server')) || !fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
    log('Pre-compiled build not found. Running pnpm build on PC first...');
    execSync('pnpm build', { stdio: 'inherit' });
  }

  log('Step 2/4: Preparing clean staging folder (EXCLUDING node_modules)...');
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  // 1. Copy essential compiled Next.js output (.next/server, .next/static, manifests)
  const stagingNext = path.join(STAGING_DIR, '.next');
  fs.mkdirSync(stagingNext, { recursive: true });

  log('Copying .next/server and .next/static...');
  copyRecursiveSync(path.join(ROOT, '.next', 'server'), path.join(stagingNext, 'server'));
  copyRecursiveSync(path.join(ROOT, '.next', 'static'), path.join(stagingNext, 'static'));

  if (fs.existsSync(path.join(ROOT, '.next', 'types'))) {
    copyRecursiveSync(path.join(ROOT, '.next', 'types'), path.join(stagingNext, 'types'));
  }

  // Copy manifest files
  for (const file of fs.readdirSync(path.join(ROOT, '.next'))) {
    if (file.endsWith('.json') || file === 'BUILD_ID') {
      fs.copyFileSync(path.join(ROOT, '.next', file), path.join(stagingNext, file));
    }
  }

  // 2. Copy public directory
  log('Copying public assets...');
  copyRecursiveSync(path.join(ROOT, 'public'), path.join(STAGING_DIR, 'public'));

  // 3. Copy Prisma schema & migrations
  log('Copying Prisma schema...');
  copyRecursiveSync(path.join(ROOT, 'prisma'), path.join(STAGING_DIR, 'prisma'));

  // 4. Copy config files
  const configFiles = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'next.config.ts',
    'tsconfig.json',
    'postcss.config.mjs',
    'prisma.config.ts',
    '.gitattributes',
    'server.js'
  ];
  for (const cf of configFiles) {
    const srcPath = path.join(ROOT, cf);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(STAGING_DIR, cf));
    }
  }

  // 5. Setup production environment files with internal Docker DB host
  log('Configuring production environment files (.env & .env.production.local)...');
  const envSource = fs.existsSync(path.join(ROOT, '.env.production.local'))
    ? path.join(ROOT, '.env.production.local')
    : path.join(ROOT, '.env');

  if (fs.existsSync(envSource)) {
    let rawEnv = fs.readFileSync(envSource, 'utf8');
    rawEnv = rawEnv.replace(
      /@nano-1\.(nura\.host|nurahost\.com):5112/g,
      '@461b710f-642a-4ea8-af0a-668edcfa5d6a.pterodactyl_nw:5112'
    );
    if (!rawEnv.includes('GOOGLE_SITE_VERIFICATION=')) {
      rawEnv += '\nGOOGLE_SITE_VERIFICATION="v2Cbd4dYoP-RAJi4ThQSTcrnAX6WlN_xEIIF8dhzjV8"\n';
    }
    if (!rawEnv.includes('SEO_INDEXING_ENABLED=')) {
      rawEnv += '\nSEO_INDEXING_ENABLED="true"\n';
    }
    if (!rawEnv.includes('INDEXNOW_KEY=')) {
      rawEnv += '\nINDEXNOW_KEY="014b76f401bfd193126b9e04845499de"\n';
    }
    fs.writeFileSync(path.join(STAGING_DIR, '.env.production.local'), rawEnv, 'utf8');
    fs.writeFileSync(path.join(STAGING_DIR, '.env'), rawEnv, 'utf8');
  }

  // 6. Copy start.sh script
  log('Step 3/4: Creating Linux launcher start.sh...');
  const startShContent = `#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
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
export PORT="\${SERVER_PORT:-\${PORT:-5060}}"
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
if [ ! -d "$ROOT/node_modules/.prisma" ]; then
  echo "[MovieFlix] Linking or generating Prisma Client..."
  PNPM_PRISMA="$(find "$ROOT/node_modules/.pnpm" -type d -name ".prisma" 2>/dev/null | head -n 1 || true)"
  if [ -n "$PNPM_PRISMA" ] && [ -d "$PNPM_PRISMA" ]; then
    ln -sfn "$PNPM_PRISMA" "$ROOT/node_modules/.prisma" 2>/dev/null || cp -r "$PNPM_PRISMA" "$ROOT/node_modules/.prisma" 2>/dev/null || true
  fi
  if [ ! -d "$ROOT/node_modules/.prisma" ]; then
    if [[ "$PM" == *"pnpm"* ]]; then
      $PM exec prisma generate || npx prisma generate || true
    else
      npx prisma generate || true
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
`.replace(/\r\n/g, '\n');

  fs.writeFileSync(path.join(STAGING_DIR, 'start.sh'), startShContent, { encoding: 'utf8', mode: 0o755 });
  // Also update local start.sh
  fs.writeFileSync(path.join(ROOT, 'start.sh'), startShContent, { encoding: 'utf8', mode: 0o755 });

  log('Step 4/4: Compressing package into movieflix-deploy.tar.gz...');
  if (fs.existsSync(OUTPUT_ARCHIVE)) {
    fs.unlinkSync(OUTPUT_ARCHIVE);
  }

  execSync(`tar.exe -czf "${OUTPUT_ARCHIVE}" -C "${STAGING_DIR}" .`, { stdio: 'inherit' });

  // Cleanup staging dir
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });

  if (fs.existsSync(OUTPUT_ARCHIVE)) {
    const stats = fs.statSync(OUTPUT_ARCHIVE);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n\x1b[32m============================================================');
    console.log(`[SUCCESS] Package created: movieflix-deploy.tar.gz (${sizeMb} MB)`);
    console.log(`[INFO] ZERO node_modules included! Upload size is super light.`);
    console.log('============================================================\x1b[0m\n');
    console.log('Cara Deploy ke NuraHost:');
    console.log('1. Buka File Manager di panel NuraHost.');
    console.log('2. Drag & drop file "movieflix-deploy.tar.gz" ke File Manager.');
    console.log('3. Klik tombol titik tiga (...) -> pilih "Unarchive" (timpa saja, node_modules lama akan tetap aman).');
    console.log('4. Hapus file "movieflix-deploy.tar.gz" setelah diekstrak.');
    console.log('5. Klik "Restart" di Console NuraHost.');
    console.log('6. Web langsung online dalam 1 detik tanpa perlu build di server!\n');
  } else {
    throw new Error('Failed to create movieflix-deploy.tar.gz');
  }
}

main().catch((err) => {
  console.error('\x1b[31m[Deploy Pack Error]\x1b[0m', err);
  process.exit(1);
});
