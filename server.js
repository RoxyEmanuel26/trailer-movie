#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Module = require('module');

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

// 2. Comprehensive pnpm virtual store resolver
// Turbopack extracts synthetic external modules into .next/node_modules/ which breaks pnpm's strict isolation.
// This O(1) resolver bridges any missing transitive dependency (e.g. pino-std-serializers, pg-types, .prisma)
const pnpmDir = path.resolve(dir, 'node_modules', '.pnpm');
const pnpmPackageMap = new Map();

if (fs.existsSync(pnpmDir)) {
  try {
    for (const folder of fs.readdirSync(pnpmDir)) {
      const nm = path.join(pnpmDir, folder, 'node_modules');
      if (fs.existsSync(nm)) {
        for (const pkg of fs.readdirSync(nm)) {
          if (!pnpmPackageMap.has(pkg)) {
            pnpmPackageMap.set(pkg, path.join(nm, pkg));
          }
          if (pkg.startsWith('@')) {
            const scopeDir = path.join(nm, pkg);
            for (const subPkg of fs.readdirSync(scopeDir)) {
              const fullScope = pkg + '/' + subPkg;
              if (!pnpmPackageMap.has(fullScope)) {
                pnpmPackageMap.set(fullScope, path.join(scopeDir, subPkg));
              }
            }
          }
        }
      }
    }
  } catch {}
}

// Ensure .prisma is mapped explicitly
const rootPrisma = path.join(dir, 'node_modules', '.prisma');
if (fs.existsSync(rootPrisma)) {
  pnpmPackageMap.set('.prisma', rootPrisma);
  pnpmPackageMap.set('.prisma/client', path.join(rootPrisma, 'client'));
  pnpmPackageMap.set('.prisma/client/default', path.join(rootPrisma, 'client', 'default.js'));
}

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return origResolve.call(this, request, parent, isMain, options);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      const matched = pnpmPackageMap.get(request);
      if (matched) {
        try {
          return origResolve.call(this, matched, parent, isMain, options);
        } catch {}
      }
    }
    throw err;
  }
};

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
