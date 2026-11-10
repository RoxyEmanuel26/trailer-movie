#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
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

const TURBOPACK_HASH_RE = /^((?:@[^/]+\/)?[^/]+)-[0-9a-f]{16}(\/.*)?$/;

// Auto-create .next/node_modules symlinks for Turbopack hashed externals
// Required because Node.js ESM `await import('pg-4c0d8067d674414d')` bypasses Module._resolveFilename
// and looks directly on disk inside .next/node_modules/.
function ensureTurbopackExternalLinks() {
  const chunksDir = path.join(dir, '.next', 'server', 'chunks');
  const nextNodeModules = path.join(dir, '.next', 'node_modules');
  if (!fs.existsSync(chunksDir)) return;

  const scanRe = /((?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)-[0-9a-f]{16}/g;
  const hashedNames = new Set([
    '@prisma/client-e2ab672a1d5aaaa9',
    'pg-4c0d8067d674414d',
    'pino-2e79642258e38174',
  ]);

  try {
    for (const file of fs.readdirSync(chunksDir)) {
      if (!file.endsWith('.js')) continue;
      const content = fs.readFileSync(path.join(chunksDir, file), 'utf8');
      let match;
      while ((match = scanRe.exec(content)) !== null) {
        hashedNames.add(match[0]);
      }
    }
  } catch {}

  for (const hashedName of hashedNames) {
    const parsed = TURBOPACK_HASH_RE.exec(hashedName);
    if (!parsed) continue;
    const basePkg = parsed[1];
    const targetDir =
      pnpmPackageMap.get(basePkg) ||
      (fs.existsSync(path.join(dir, 'node_modules', basePkg))
        ? path.join(dir, 'node_modules', basePkg)
        : null);
    if (!targetDir || !fs.existsSync(targetDir)) continue;

    const linkPath = path.join(nextNodeModules, hashedName);
    if (fs.existsSync(linkPath)) continue;

    try {
      fs.mkdirSync(path.dirname(linkPath), { recursive: true });
      fs.symlinkSync(targetDir, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    } catch {
      try {
        fs.cpSync(targetDir, linkPath, { recursive: true });
      } catch {}
    }
  }
}

ensureTurbopackExternalLinks();

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

      const hashMatch = typeof request === 'string' ? TURBOPACK_HASH_RE.exec(request) : null;
      if (hashMatch) {
        const basePkg = hashMatch[1];
        const subPath = hashMatch[2] || '';
        const strippedRequest = basePkg + subPath;
        try {
          return origResolve.call(this, strippedRequest, parent, isMain, options);
        } catch {}
        const mappedPkg = pnpmPackageMap.get(basePkg);
        if (mappedPkg) {
          try {
            return origResolve.call(this, mappedPkg + subPath, parent, isMain, options);
          } catch {}
        }
      }
    }
    throw err;
  }
};

// 3. Public HTML Edge & Browser Cache-Control Optimizer
// Because RootLayout uses force-dynamic so builds succeed without a live database,
// Next.js defaults HTML responses to `private, no-cache, no-store`. We upgrade public
// 200 OK indexable HTML responses to public SWR caching for Cloudflare & crawlers.
const NON_CACHEABLE_PREFIXES = [
  '/api',
  '/admin',
  '/login',
  '/search',
  '/monitoring',
  '/person-not-found',
  '/_next',
  '/sitemap.xml',
  '/sitemaps',
  '/feed.xml',
  '/robots.txt',
  '/llms.txt',
  '/indexnow-key.txt',
  '/manifest.webmanifest',
];

const LONG_TTL_PREFIXES = [
  '/watch/',
  '/person/',
  '/about',
  '/methodology',
  '/privacy',
  '/terms',
  '/contact',
  '/dmca',
];

function getPublicCachePolicy(pathname) {
  for (const prefix of NON_CACHEABLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return null;
    }
  }
  for (const prefix of LONG_TTL_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) {
      return {
        browserAndEdge: 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400',
        cdnOnly: 'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=86400',
      };
    }
  }
  return {
    browserAndEdge: 'public, max-age=30, s-maxage=600, stale-while-revalidate=3600, stale-if-error=86400',
    cdnOnly: 'public, max-age=600, stale-while-revalidate=3600, stale-if-error=86400',
  };
}

function installPublicCacheHeaderHook() {
  const origEmit = http.Server.prototype.emit;
  http.Server.prototype.emit = function (event, req, res) {
    if (event === 'request' && req && res) {
      res.__movieflixReq = req;
    }
    return origEmit.apply(this, arguments);
  };

  const origWriteHead = http.ServerResponse.prototype.writeHead;
  http.ServerResponse.prototype.writeHead = function (statusCode, statusMessage, headers) {
    try {
      const req = this.__movieflixReq;
      const code = typeof statusCode === 'number' ? statusCode : this.statusCode;
      if (req && code === 200 && req.method === 'POST' && (req.url || '').startsWith('/api/internal/revalidate')) {
        if (typeof global.__movieflixTriggerSitemapRefresh === 'function') {
          global.__movieflixTriggerSitemapRefresh();
        }
      }
      if (req && code === 200 && (req.method === 'GET' || req.method === 'HEAD')) {
        const rawUrl = req.url || '/';
        const qIndex = rawUrl.indexOf('?');
        const pathname = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
        const search = qIndex >= 0 ? rawUrl.slice(qIndex + 1) : '';
        const isRsc =
          req.headers['rsc'] === '1' ||
          /(?:^|&)_rsc=/.test(search);
        const cookieHeader = req.headers['cookie'] || '';
        const hasAuthCookie =
          cookieHeader.includes('trailer-movie.session_token') ||
          cookieHeader.includes('better-auth.session_token');

        if (!isRsc && !hasAuthCookie) {
          const policy = getPublicCachePolicy(pathname);
          if (policy) {
            const hdrObj =
              typeof statusMessage === 'object' && statusMessage !== null
                ? statusMessage
                : typeof headers === 'object' && headers !== null
                  ? headers
                  : null;

            const getHdr = (name) => {
              const lower = name.toLowerCase();
              if (hdrObj) {
                for (const k of Object.keys(hdrObj)) {
                  if (k.toLowerCase() === lower) return String(hdrObj[k]);
                }
              }
              const existing = this.getHeader(name);
              return existing ? String(existing) : '';
            };

            const setHdr = (name, value) => {
              if (hdrObj) {
                for (const k of Object.keys(hdrObj)) {
                  if (k.toLowerCase() === name.toLowerCase()) {
                    delete hdrObj[k];
                  }
                }
              }
              this.setHeader(name, value);
            };

            const contentType = getHdr('content-type').toLowerCase();
            const robotsTag = getHdr('x-robots-tag').toLowerCase();
            if (contentType.startsWith('text/html') && !robotsTag.includes('noindex')) {
              setHdr('Cache-Control', policy.browserAndEdge);
              setHdr('CDN-Cache-Control', policy.cdnOnly);
              setHdr('Cloudflare-CDN-Cache-Control', policy.cdnOnly);
              setHdr('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding');
            }
          }
        }
      }
    } catch {}
    return origWriteHead.apply(this, arguments);
  };
}

installPublicCacheHeaderHook();

// 4. Gentle Background Sitemap Warmer & Local Force-Rebuilder
function fetchLocalText(port, urlPath, hostHeader, originToken, revalidationSecret) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        timeout: 120_000,
        headers: {
          Host: hostHeader,
          'User-Agent': 'MovieFlix-Sitemap-Warmer/1.0',
          ...(originToken ? { 'x-movieflix-origin-token': originToken } : {}),
          ...(revalidationSecret ? { Authorization: `Bearer ${revalidationSecret}` } : {}),
        },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode} for ${urlPath}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout warming ${urlPath}`));
    });
  });
}

function scheduleSitemapWarmup(port) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.movieflix.site';
  let hostHeader = 'www.movieflix.site';
  try {
    hostHeader = new URL(appUrl).host;
  } catch {}
  const originToken = process.env.ORIGIN_GATE_SECRET || '';
  const revalidationSecret = process.env.REVALIDATION_SECRET || '';
  let warmupRunning = false;
  let pendingForceRefresh = false;
  let debounceTimer = null;

  const runWarmup = async (forceRefresh = false) => {
    if (warmupRunning) {
      if (forceRefresh) pendingForceRefresh = true;
      return;
    }
    warmupRunning = true;
    try {
      const secretToUse = forceRefresh ? revalidationSecret : '';
      const indexXml = await fetchLocalText(port, '/sitemap.xml', hostHeader, originToken, secretToUse);
      const locMatches = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      const movieShards = locMatches.filter((u) => u.includes('/sitemaps/movies-'));
      const peopleShards = locMatches.filter((u) => u.includes('/sitemaps/people-'));
      const newestMovieShard = movieShards[movieShards.length - 1] || '';
      const newestPeopleShard = peopleShards[peopleShards.length - 1] || '';

      for (const loc of locMatches) {
        try {
          const parsed = new URL(loc);
          const isHotShard =
            parsed.pathname === '/sitemaps/core' ||
            loc === newestMovieShard ||
            loc === newestPeopleShard;
          await fetchLocalText(
            port,
            parsed.pathname,
            hostHeader,
            originToken,
            forceRefresh && isHotShard ? revalidationSecret : '',
          );
          // Pause 1.5s between shards to keep CPU and DB load minimal
          await new Promise((r) => setTimeout(r, 1500));
        } catch {}
      }
      console.log(
        `[MovieFlix] Background sitemap cache ${forceRefresh ? 'rebuilt' : 'warmed'} (${locMatches.length} shards ready).`,
      );
    } catch (err) {
      console.warn('[MovieFlix] Background sitemap warmup skipped:', err && err.message ? err.message : err);
    } finally {
      warmupRunning = false;
      if (pendingForceRefresh) {
        pendingForceRefresh = false;
        void runWarmup(true);
      }
    }
  };

  global.__movieflixTriggerSitemapRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runWarmup(true);
    }, 3_000).unref();
  };

  setTimeout(() => {
    void runWarmup(false);
    setInterval(() => {
      void runWarmup(true);
    }, 4 * 3600 * 1000).unref();
  }, 25_000).unref();
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
})
  .then(() => {
    scheduleSitemapWarmup(port);
  })
  .catch((err) => {
    console.error('[MovieFlix] Server startup error:', err);
    process.exit(1);
  });
