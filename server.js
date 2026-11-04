#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.resolve(__dirname);

// 1. Auto-load env files (.env.production.local > .env)
function loadEnvFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(filePath);
      return;
    }
  } catch {}

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

loadEnvFileSafe(path.join(dir, '.env.production.local'));
loadEnvFileSafe(path.join(dir, '.env'));

// 2. Ensure Prisma Client (.prisma) is linked & resolvable across pnpm isolation
function linkPrismaClient() {
  const rootModules = path.join(dir, 'node_modules');
  const rootPrisma = path.join(rootModules, '.prisma');
  const pnpmDir = path.join(rootModules, '.pnpm');

  let sourcePrisma = null;

  if (fs.existsSync(rootPrisma)) {
    sourcePrisma = rootPrisma;
  } else if (fs.existsSync(pnpmDir)) {
    try {
      for (const folder of fs.readdirSync(pnpmDir)) {
        if (folder.startsWith('@prisma+client@')) {
          const candidate = path.join(pnpmDir, folder, 'node_modules', '.prisma');
          if (fs.existsSync(candidate)) {
            sourcePrisma = candidate;
            try {
              fs.symlinkSync(candidate, rootPrisma, 'junction');
            } catch {
              try {
                fs.cpSync(candidate, rootPrisma, { recursive: true });
              } catch {}
            }
            break;
          }
        }
      }
    } catch {}
  }

  // Also link into .next/node_modules/.prisma if .next/node_modules exists
  const nextNodeModules = path.join(dir, '.next', 'node_modules');
  if (fs.existsSync(nextNodeModules)) {
    const nextPrisma = path.join(nextNodeModules, '.prisma');
    if (!fs.existsSync(nextPrisma)) {
      const src = sourcePrisma || rootPrisma;
      if (src && fs.existsSync(src)) {
        try {
          fs.symlinkSync(src, nextPrisma, 'junction');
        } catch {
          try {
            fs.cpSync(src, nextPrisma, { recursive: true });
          } catch {}
        }
      }
    }
  }
}

try {
  linkPrismaClient();
  require.resolve('.prisma/client/default');
} catch {
  // If .prisma still cannot be resolved, run prisma generate once
  try {
    console.log('[MovieFlix] Generating Prisma Client for current environment...');
    execSync('npx prisma generate', { cwd: dir, stdio: 'inherit' });
    linkPrismaClient();
  } catch (err) {
    console.warn('[MovieFlix] Notice: npx prisma generate completed or skipped:', err.message);
  }
}

const port = parseInt(process.env.PORT || process.env.SERVER_PORT || '5060', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

process.env.NODE_ENV = 'production';
process.env.PORT = String(port);
process.env.HOSTNAME = hostname;

const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir,
  isDev: false,
  hostname,
  port,
}).catch((err) => {
  console.error('[MovieFlix] Server startup error:', err);
  process.exit(1);
});
