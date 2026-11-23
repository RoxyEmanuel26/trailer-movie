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
  '/tonight',
  '/watchlist',
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
  '/movies-like/',
  '/collection/',
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
    const isMatch = prefix.endsWith('/')
      ? pathname.startsWith(prefix)
      : pathname === prefix || pathname.startsWith(prefix + '/');
    if (isMatch) {
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
    let nextArgs = arguments;
    try {
      const req = this.__movieflixReq;
      const code = typeof statusCode === 'number' ? statusCode : this.statusCode;
      if (req && code === 200 && (req.method === 'GET' || req.method === 'HEAD')) {
        const rawUrl = req.url || '/';
        const qIndex = rawUrl.indexOf('?');
        const pathname = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
        const search = qIndex >= 0 ? rawUrl.slice(qIndex + 1) : '';
        const isRsc =
          req.headers['rsc'] === '1' ||
          Boolean(req.headers['next-router-prefetch']) ||
          Boolean(req.headers['next-router-segment-prefetch']) ||
          /(?:^|&)_rsc=/.test(search);
        const cookieHeader = req.headers['cookie'] || '';
        const hasAuthCookie =
          cookieHeader.includes('trailer-movie.session_token') ||
          cookieHeader.includes('better-auth.session_token');

        if (!isRsc && !hasAuthCookie) {
          const policy = getPublicCachePolicy(pathname);
          if (policy) {
            const hdrArgIndex =
              typeof statusMessage === 'object' && statusMessage !== null
                ? 1
                : typeof headers === 'object' && headers !== null
                  ? 2
                  : -1;
            const rawHdrArg = hdrArgIndex === 1 ? statusMessage : hdrArgIndex === 2 ? headers : null;
            // Bail out cleanly if Node's flat-array headers form was passed to writeHead.
            if (Array.isArray(rawHdrArg)) {
              return origWriteHead.apply(this, arguments);
            }
            const hdrObj = rawHdrArg ? { ...rawHdrArg } : null;

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
            const setCookie = getHdr('set-cookie');
            if (contentType.startsWith('text/html') && !robotsTag.includes('noindex') && !setCookie) {
              setHdr('Cache-Control', policy.browserAndEdge);
              setHdr('CDN-Cache-Control', policy.cdnOnly);
              setHdr('Cloudflare-CDN-Cache-Control', policy.cdnOnly);
              const existingVary = getHdr('vary')
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean);
              const requiredVary = [
                'RSC',
                'Next-Router-State-Tree',
                'Next-Router-Prefetch',
                'Next-Router-Segment-Prefetch',
                'Next-Url',
                'Accept-Encoding',
              ];
              const varyMap = new Map();
              for (const token of [...existingVary, ...requiredVary]) {
                const lower = token.toLowerCase();
                if (!varyMap.has(lower)) varyMap.set(lower, token);
              }
              setHdr('Vary', Array.from(varyMap.values()).join(', '));
              if (hdrObj && hdrArgIndex >= 0) {
                nextArgs = Array.from(arguments);
                nextArgs[hdrArgIndex] = hdrObj;
              }
            }
          }
        }
      }
    } catch {}
    return origWriteHead.apply(this, nextArgs);
  };
}

installPublicCacheHeaderHook();

// 4. Gentle Background Sitemap Warmer & Local Force-Rebuilder
function fetchLocalText(port, urlPath, hostHeader, originToken, revalidationSecret, discardBody = false) {
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
        res.on('error', reject);
        if (discardBody) {
          res.resume();
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve('');
            } else {
              reject(new Error(`HTTP ${res.statusCode} for ${urlPath}`));
            }
          });
          return;
        }
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
  const FORCE_COOLDOWN_MS = 10 * 60_000;
  let warmupRunning = false;
  let pendingForceRefresh = false;
  let debounceTimer = null;
  let cooldownTimer = null;
  let lastForceRebuildAt = 0;

  const scheduleDeferredForce = (delayMs) => {
    if (cooldownTimer) return;
    cooldownTimer = setTimeout(() => {
      cooldownTimer = null;
      void runWarmup(true);
    }, Math.max(1_000, delayMs)).unref();
  };

  const runWarmup = async (forceRefresh = false) => {
    if (warmupRunning) {
      if (forceRefresh) pendingForceRefresh = true;
      return;
    }
    if (forceRefresh) {
      const elapsed = Date.now() - lastForceRebuildAt;
      if (lastForceRebuildAt > 0 && elapsed < FORCE_COOLDOWN_MS) {
        scheduleDeferredForce(FORCE_COOLDOWN_MS - elapsed);
        return;
      }
    }
    warmupRunning = true;
    try {
      const secretToUse = forceRefresh ? revalidationSecret : '';
      const indexXml = await fetchLocalText(port, '/sitemap.xml', hostHeader, originToken, secretToUse, false);
      const shardEntries = [
        ...indexXml.matchAll(/<sitemap><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/sitemap>/g),
      ].map((m) => ({ loc: m[1].replace(/&amp;/g, '&'), lastmod: m[2] || null }));
      const locMatches = shardEntries.length > 0
        ? shardEntries
        : [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => ({ loc: m[1].replace(/&amp;/g, '&'), lastmod: null }));
      const movieShards = locMatches.filter((entry) => entry.loc.includes('/sitemaps/movies-'));
      const newestMovieShard = movieShards[movieShards.length - 1]?.loc || '';
      const recentCutoffMs = Date.now() - 6 * 3600 * 1000;

      let hotShardsAttempted = 0;
      let hotShardsSucceeded = 0;

      for (const entry of locMatches) {
        let isHotShard = false;
        try {
          const parsed = new URL(entry.loc);
          const lastModMs = entry.lastmod ? Date.parse(entry.lastmod) : NaN;
          const modifiedRecently =
            parsed.pathname.startsWith('/sitemaps/movies-') &&
            Number.isFinite(lastModMs) &&
            lastModMs >= recentCutoffMs;
          // Force-refresh /sitemaps/core, the newest movie shard, and any movie shard
          // whose <lastmod> shows newly published/updated films within the last 6 hours.
          // Unchanged movie shards and people-* shards keep their 6-hour disk snapshot.
          isHotShard =
            parsed.pathname === '/sitemaps/core' ||
            entry.loc === newestMovieShard ||
            modifiedRecently;
          if (isHotShard) hotShardsAttempted += 1;
          await fetchLocalText(
            port,
            parsed.pathname,
            hostHeader,
            originToken,
            forceRefresh && isHotShard ? revalidationSecret : '',
            true,
          );
          if (isHotShard) hotShardsSucceeded += 1;
          // Pause 2s between shards to keep CPU and DB load minimal
          await new Promise((r) => setTimeout(r, 2000));
        } catch {}
      }
      if (forceRefresh && (hotShardsAttempted === 0 || hotShardsSucceeded === hotShardsAttempted)) {
        lastForceRebuildAt = Date.now();
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
    }, 10_000).unref();
  };

  const warmCoreHubs = async () => {
    const corePaths = [
      '/',
      '/upcoming',
      '/collections',
      '/studios',
      '/themes',
      '/movies/under-90-minutes',
      '/years',
      '/countries',
      '/genres',
      '/streaming',
      '/popular',
      '/feed.xml',
    ];
    for (const p of corePaths) {
      try {
        await fetchLocalText(port, p, hostHeader, originToken, '', true);
        await new Promise((r) => setTimeout(r, 800));
      } catch {}
    }
  };

  const runDailySeoMaintenanceIfEnabled = () => {
    if (process.env.ENABLE_AUTO_SEO_MAINTENANCE !== 'true' || !revalidationSecret) return;
    try {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/internal/seo-maintain',
          method: 'POST',
          headers: {
            Host: hostHeader,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${revalidationSecret}`,
            ...(originToken ? { 'x-movieflix-origin-token': originToken } : {}),
          },
          timeout: 120_000,
        },
        (res) => {
          res.resume();
        },
      );
      req.on('error', () => {});
      req.write(JSON.stringify({ dryRun: false, submitIndexNow: true }));
      req.end();
    } catch {}
  };

  setTimeout(() => {
    void warmCoreHubs().then(() => runWarmup(false));
    setInterval(() => {
      void runWarmup(true);
    }, 4 * 3600 * 1000).unref();
    if (process.env.ENABLE_AUTO_SEO_MAINTENANCE === 'true') {
      setInterval(() => {
        runDailySeoMaintenanceIfEnabled();
      }, 24 * 3600 * 1000).unref();
    }
  }, 15_000).unref();
}

// 5. Periodic Async Disk Housekeeper (prevents cache bloat on small VPS/Pterodactyl disks)
const ACTIVE_SITEMAP_PREFIX = 'v5-';

async function collectFilesRecursive(rootDir, maxDepth = 4, depth = 0, out = []) {
  if (depth > maxDepth) return out;
  let entries;
  try {
    entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      await collectFilesRecursive(fullPath, maxDepth, depth + 1, out);
    } else if (entry.isFile()) {
      try {
        const info = await fs.promises.stat(fullPath);
        out.push({ path: fullPath, name: entry.name, size: info.size, mtimeMs: info.mtimeMs });
      } catch {}
    }
  }
  return out;
}

async function runDiskHousekeeping() {
  const fsp = fs.promises;
  let removedFiles = 0;
  let reclaimedBytes = 0;
  const now = Date.now();

  const unlinkSafe = async (filePath, knownSize = 0) => {
    try {
      let size = knownSize;
      if (!size) {
        const info = await fsp.stat(filePath);
        size = info.size;
      }
      await fsp.unlink(filePath);
      removedFiles += 1;
      reclaimedBytes += size;
    } catch {}
  };

  // 1. Remove build/dev-only Next.js caches that are never needed at production runtime
  const buildOnlyDirs = [
    path.join(dir, '.next', 'dev'),
    path.join(dir, '.next', 'cache', 'turbopack'),
    path.join(dir, '.next', 'cache', 'webpack'),
    path.join(dir, '.next', 'cache', 'swc'),
  ];
  for (const target of buildOnlyDirs) {
    try {
      if (fs.existsSync(target)) {
        const files = await collectFilesRecursive(target, 6);
        for (const f of files) reclaimedBytes += f.size;
        removedFiles += files.length || 1;
        await fsp.rm(target, { recursive: true, force: true });
      }
    } catch {}
  }

  // 2. Bound .next/cache/fetch-cache (Next.js never GCs expired fetch-cache entries)
  const fetchCacheDir = path.join(dir, '.next', 'cache', 'fetch-cache');
  const fetchCacheFiles = (await collectFilesRecursive(fetchCacheDir, 2)).filter(
    (f) => f.name !== 'tags-manifest.json',
  );
  const fetchCutoffMs = now - 2 * 3600 * 1000;
  const survivors = [];
  for (const file of fetchCacheFiles) {
    if (file.mtimeMs < fetchCutoffMs) {
      await unlinkSafe(file.path, file.size);
    } else {
      survivors.push(file);
    }
  }
  const MAX_FETCH_CACHE_FILES = 400;
  const MAX_FETCH_CACHE_BYTES = 20 * 1024 * 1024;
  let totalBytes = survivors.reduce((acc, f) => acc + f.size, 0);
  if (survivors.length > MAX_FETCH_CACHE_FILES || totalBytes > MAX_FETCH_CACHE_BYTES) {
    survivors.sort((a, b) => a.mtimeMs - b.mtimeMs);
    let remaining = survivors.length;
    for (const file of survivors) {
      if (remaining <= MAX_FETCH_CACHE_FILES && totalBytes <= MAX_FETCH_CACHE_BYTES) break;
      await unlinkSafe(file.path, file.size);
      remaining -= 1;
      totalBytes -= file.size;
    }
  }

  // 3. Prune any stale .next/cache/images entries older than 24 hours
  const imageCacheDir = path.join(dir, '.next', 'cache', 'images');
  const imageCutoffMs = now - 24 * 3600 * 1000;
  for (const file of await collectFilesRecursive(imageCacheDir, 3)) {
    if (file.mtimeMs < imageCutoffMs) {
      await unlinkSafe(file.path, file.size);
    }
  }

  // 4. Prune obsolete sitemap snapshot versions (!= v4-*) and orphaned .tmp files
  const tmpCutoffMs = now - 30 * 60 * 1000;
  const sitemapDirs = Array.from(
    new Set(
      [
        process.env.SITEMAP_CACHE_DIR && process.env.SITEMAP_CACHE_DIR.trim(),
        path.join(dir, '.cache', 'sitemaps'),
        path.join(dir, 'shared', 'sitemaps'),
      ].filter(Boolean),
    ),
  );
  for (const smDir of sitemapDirs) {
    let entries;
    try {
      entries = await fsp.readdir(smDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(smDir, entry.name);
      if (entry.name.endsWith('.xml') && !entry.name.startsWith(ACTIVE_SITEMAP_PREFIX)) {
        await unlinkSafe(fullPath);
      } else if (entry.name.endsWith('.tmp')) {
        try {
          const info = await fsp.stat(fullPath);
          if (info.mtimeMs < tmpCutoffMs) await unlinkSafe(fullPath, info.size);
        } catch {}
      }
    }
    // Prune orphaned .tmp files inside public-data/
    const publicDataDir = path.join(smDir, 'public-data');
    try {
      for (const entry of await fsp.readdir(publicDataDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;
        const fullPath = path.join(publicDataDir, entry.name);
        try {
          const info = await fsp.stat(fullPath);
          if (info.mtimeMs < tmpCutoffMs) await unlinkSafe(fullPath, info.size);
        } catch {}
      }
    } catch {}
  }

  if (removedFiles > 0) {
    const reclaimedMb = (reclaimedBytes / (1024 * 1024)).toFixed(2);
    console.log(
      `[MovieFlix] Disk housekeeper removed ${removedFiles} stale file(s) (${reclaimedMb} MB reclaimed).`,
    );
  }
}

function scheduleDiskHousekeeping() {
  setTimeout(() => {
    void runDiskHousekeeping().catch(() => {});
    setInterval(() => {
      void runDiskHousekeeping().catch(() => {});
    }, 6 * 3600 * 1000).unref();
  }, 120_000).unref();
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
    scheduleDiskHousekeeping();
  })
  .catch((err) => {
    console.error('[MovieFlix] Server startup error:', err);
    process.exit(1);
  });
