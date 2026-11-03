import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const STANDALONE_DIR = path.join(ROOT, '.next', 'standalone');
const STATIC_DIR = path.join(ROOT, '.next', 'static');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_ZIP = path.join(ROOT, 'movieflix-deploy.zip');

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

function derefCopy(src: string, dest: string) {
  try {
    let realPath = src;
    const stat = fs.lstatSync(src);
    if (stat.isSymbolicLink()) {
      realPath = fs.realpathSync(src);
    }
    if (fs.existsSync(dest)) {
      const destStat = fs.lstatSync(dest);
      if (destStat.isSymbolicLink()) {
        fs.unlinkSync(dest);
      } else {
        return;
      }
    }
    copyRecursiveSync(realPath, dest);
  } catch {
    // ignore copy errors for optional files
  }
}

function derefReplace(targetPath: string) {
  try {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      const realPath = fs.realpathSync(targetPath);
      fs.unlinkSync(targetPath);
      copyRecursiveSync(realPath, targetPath);
    }
  } catch {
    // ignore
  }
}

function flattenAndDerefNodeModules(nmDir: string) {
  log('Flattening and dereferencing node_modules to eliminate Windows symlinks...');
  if (!fs.existsSync(nmDir)) return;

  // 1. Copy any virtual packages from .pnpm/node_modules directly into root node_modules
  const pnpmVirtualNm = path.join(nmDir, '.pnpm', 'node_modules');
  if (fs.existsSync(pnpmVirtualNm)) {
    for (const item of fs.readdirSync(pnpmVirtualNm)) {
      const src = path.join(pnpmVirtualNm, item);
      const dest = path.join(nmDir, item);
      if (item.startsWith('@')) {
        fs.mkdirSync(dest, { recursive: true });
        for (const subItem of fs.readdirSync(src)) {
          const subSrc = path.join(src, subItem);
          const subDest = path.join(dest, subItem);
          derefCopy(subSrc, subDest);
        }
      } else {
        derefCopy(src, dest);
      }
    }
  }

  // 2. Resolve all symlinks in root node_modules (e.g. next, react, sharp, pg, pino)
  for (const item of fs.readdirSync(nmDir)) {
    if (item === '.pnpm') continue;
    const itemPath = path.join(nmDir, item);
    if (item.startsWith('@')) {
      for (const subItem of fs.readdirSync(itemPath)) {
        const subPath = path.join(itemPath, subItem);
        derefReplace(subPath);
      }
    } else {
      derefReplace(itemPath);
    }
  }
}

async function main() {
  log('Step 1/5: Checking Next.js standalone build...');
  if (!fs.existsSync(STANDALONE_DIR) || !fs.existsSync(path.join(STANDALONE_DIR, 'server.js'))) {
    log('Standalone build not found. Running pnpm build first...');
    execSync('pnpm build', { stdio: 'inherit' });
  }

  log('Step 2/5: Copying static assets (.next/static)...');
  const targetStatic = path.join(STANDALONE_DIR, '.next', 'static');
  copyRecursiveSync(STATIC_DIR, targetStatic);

  log('Step 3/5: Copying public directory...');
  const targetPublic = path.join(STANDALONE_DIR, 'public');
  copyRecursiveSync(PUBLIC_DIR, targetPublic);

  log('Step 4/5: Creating portable start.sh and compat launcher...');
  // Ensure standalone .env uses internal container Docker host for PostgreSQL
  const standaloneEnv = path.join(STANDALONE_DIR, '.env');
  if (fs.existsSync(standaloneEnv)) {
    let rawEnv = fs.readFileSync(standaloneEnv, 'utf8');
    rawEnv = rawEnv.replace(
      /@nano-1\.nura\.host:5112/g,
      '@461b710f-642a-4ea8-af0a-668edcfa5d6a.pterodactyl_nw:5112'
    );
    fs.writeFileSync(standaloneEnv, rawEnv, 'utf8');
    fs.writeFileSync(path.join(STANDALONE_DIR, '.env.production.local'), rawEnv, 'utf8');
  }

  const startShContent = `#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE=""
if [[ -f "$ROOT/.env.production.local" ]]; then
  ENV_FILE="$ROOT/.env.production.local"
elif [[ -f "$ROOT/shared/.env.production.local" ]]; then
  ENV_FILE="$ROOT/shared/.env.production.local"
elif [[ -f "$ROOT/.env.production" ]]; then
  ENV_FILE="$ROOT/.env.production"
elif [[ -f "$ROOT/.env" ]]; then
  ENV_FILE="$ROOT/.env"
fi

export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT="\${SERVER_PORT:-\${PORT:-5060}}"

echo "============================================================"
echo "[MovieFlix] Starting Standalone Production Server"
echo "[MovieFlix] Port: $PORT | Host: $HOSTNAME"
if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  echo "[MovieFlix] Env:  $ENV_FILE"
  echo "============================================================"
  exec node --env-file="$ENV_FILE" server.js
else
  echo "[MovieFlix] Warning: No .env file found. Using environment."
  echo "============================================================"
  exec node server.js
fi
`.replace(/\r\n/g, '\n');

  fs.writeFileSync(path.join(STANDALONE_DIR, 'start.sh'), startShContent, { encoding: 'utf8', mode: 0o755 });

  // Compatibility runner in case Pterodactyl is configured with deploy/pterodactyl/start-release.sh
  const compatDir = path.join(STANDALONE_DIR, 'deploy', 'pterodactyl');
  fs.mkdirSync(compatDir, { recursive: true });
  const compatStartContent = `#!/usr/bin/env bash
ROOT="/home/container"
if [[ -f "$ROOT/start.sh" ]]; then
  exec bash "$ROOT/start.sh"
else
  cd "$ROOT"
  exec node server.js
fi
`.replace(/\r\n/g, '\n');
  fs.writeFileSync(path.join(compatDir, 'start-release.sh'), compatStartContent, { encoding: 'utf8', mode: 0o755 });

  flattenAndDerefNodeModules(path.join(STANDALONE_DIR, 'node_modules'));

  log('Step 5/5: Compressing package into movieflix-deploy.zip...');
  if (fs.existsSync(OUTPUT_ZIP)) {
    fs.unlinkSync(OUTPUT_ZIP);
  }

  // Use tar.exe on Windows or zip on Linux
  try {
    execSync(`tar.exe -a -cf "${OUTPUT_ZIP}" -C "${STANDALONE_DIR}" .`, { stdio: 'inherit' });
  } catch {
    log('tar.exe failed or unavailable, falling back to powershell Compress-Archive...');
    execSync(`powershell -Command "Compress-Archive -Path '${STANDALONE_DIR}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`, { stdio: 'inherit' });
  }

  if (fs.existsSync(OUTPUT_ZIP)) {
    const stats = fs.statSync(OUTPUT_ZIP);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n\x1b[32m============================================================');
    console.log(`[SUCCESS] Package created: movieflix-deploy.zip (${sizeMb} MB)`);
    console.log('============================================================\x1b[0m\n');
    console.log('Cara Deploy ke NuraHost:');
    console.log('1. Buka File Manager di panel NuraHost.');
    console.log('2. Drag & drop file "movieflix-deploy.zip" ke File Manager.');
    console.log('3. Klik tombol titik tiga (...) pada file -> pilih "Unarchive".');
    console.log('4. Klik tombol "Restart" di Console NuraHost.');
    console.log('5. Web langsung online dalam 2 detik tanpa perlu build di server!\n');
  } else {
    throw new Error('Failed to create movieflix-deploy.zip');
  }
}

main().catch((err) => {
  console.error('\x1b[31m[Deploy Pack Error]\x1b[0m', err);
  process.exit(1);
});
