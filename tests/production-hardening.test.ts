import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hasValidRevalidationSecret, isAllowedRevalidationPath } from '../src/lib/revalidation';
import {
  generateSitemapWithFallback,
  readSitemapSnapshot,
  sitemapSnapshotKey,
  warmSitemapSnapshots,
} from '../src/lib/sitemap-cache';
import { hasValidOriginToken, ORIGIN_GATE_HEADER } from '../src/lib/security/origin-gate';

test('origin token rejects missing, wrong, or duplicate values', () => {
  const secret = 's'.repeat(48);
  assert.equal(hasValidOriginToken(new Headers(), secret), false);
  assert.equal(hasValidOriginToken(new Headers({ [ORIGIN_GATE_HEADER]: 'w'.repeat(48) }), secret), false);
  assert.equal(hasValidOriginToken(new Headers({ [ORIGIN_GATE_HEADER]: secret }), secret), true);
  assert.equal(hasValidOriginToken(new Headers({ [ORIGIN_GATE_HEADER]: `${secret}, ${secret}` }), secret), false);
  assert.equal(hasValidOriginToken(new Headers({ [ORIGIN_GATE_HEADER]: secret }), undefined), false);
});

test('internal revalidation accepts only canonical public detail paths', () => {
  assert.equal(isAllowedRevalidationPath('/watch/example-1'), true);
  assert.equal(isAllowedRevalidationPath('/person/example-2'), true);
  assert.equal(isAllowedRevalidationPath('/streaming/netflix'), true);
  assert.equal(isAllowedRevalidationPath('/api/admin/imports'), false);
  assert.equal(isAllowedRevalidationPath('/watch/example?preview=1'), false);
  assert.equal(isAllowedRevalidationPath('/watch/../admin'), false);
  assert.equal(isAllowedRevalidationPath('https://evil.example/watch/a'), false);
});

test('sitemap refresh authentication uses the dedicated revalidation secret', () => {
  const previous = process.env.REVALIDATION_SECRET;
  process.env.REVALIDATION_SECRET = 'r'.repeat(32);
  try {
    assert.equal(hasValidRevalidationSecret(new Request('https://www.movieflix.site/sitemap.xml')), false);
    assert.equal(hasValidRevalidationSecret(new Request('https://www.movieflix.site/sitemap.xml', {
      headers: { Authorization: `Bearer ${'r'.repeat(32)}` },
    })), true);
  } finally {
    if (previous === undefined) delete process.env.REVALIDATION_SECRET;
    else process.env.REVALIDATION_SECRET = previous;
  }
});

test('sitemap generation persists a snapshot and serves it after a failure', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'movieflix-sitemap-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  process.env.SITEMAP_CACHE_DIR = directory;
  try {
    const current = await generateSitemapWithFallback('test-shard', async () => '<urlset />');
    assert.deepEqual(current, { xml: '<urlset />', stale: false });
    assert.equal(await readFile(path.join(directory, 'test-shard.xml'), 'utf8'), '<urlset />');
    const fallback = await generateSitemapWithFallback('test-shard', async () => {
      throw new Error('database busy');
    });
    assert.deepEqual(fallback, { xml: '<urlset />', stale: true });
  } finally {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('sitemap snapshots expire, remain available for outages, and cannot revive removed shards', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'movieflix-sitemap-ttl-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  process.env.SITEMAP_CACHE_DIR = directory;
  try {
    await generateSitemapWithFallback('movies-1', async () => '<urlset />');
    const file = path.join(directory, 'movies-1.xml');
    const modified = (await stat(file)).mtimeMs;
    await generateSitemapWithFallback('movies-1', async () => '<urlset />');
    assert.equal((await stat(file)).mtimeMs, modified);
    const old = new Date(Date.now() - 600_000);
    await utimes(file, old, old);
    assert.equal(await readSitemapSnapshot('movies-1'), null);
    assert.equal(await readSitemapSnapshot('movies-1', Infinity), '<urlset />');
    assert.deepEqual(await generateSitemapWithFallback('movies-1', async () => { throw new Error('database timeout'); }), { xml: '<urlset />', stale: true });
    await assert.rejects(generateSitemapWithFallback('movies-1', async () => { throw Object.assign(new Error('not found'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }); }));
  } finally {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('valid sitemap XML is served even when snapshot storage is unavailable', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'movieflix-sitemap-disk-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  const file = path.join(directory, 'not-a-directory');
  await writeFile(file, 'occupied');
  process.env.SITEMAP_CACHE_DIR = file;
  try {
    assert.deepEqual(await generateSitemapWithFallback('core', async () => '<urlset />'), { xml: '<urlset />', stale: false });
  } finally {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('sitemap cache warmer writes versioned v4 snapshot keys read by sitemap routes', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'movieflix-sitemap-warm-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  process.env.SITEMAP_CACHE_DIR = directory;
  try {
    assert.equal(sitemapSnapshotKey('sitemap-index'), 'v4-sitemap-index');
    assert.equal(sitemapSnapshotKey('core'), 'v4-core');
    assert.equal(sitemapSnapshotKey('movies-0'), 'v4-movies-0');
    assert.equal(sitemapSnapshotKey('people-0'), 'v4-people-0');

    const summary = await warmSitemapSnapshots({
      siteUrl: 'https://www.movieflix.site',
      getMoviePageCount: async () => 1,
      getPersonPageCount: async () => 1,
      getCoreEntries: async () => [{ url: 'https://www.movieflix.site' }],
      getMovieEntries: async (page) => [{ url: `https://www.movieflix.site/watch/test-${page}` }],
      getPersonEntries: async (page) => [{ url: `https://www.movieflix.site/person/test-${page}` }],
    });

    assert.deepEqual(summary, { moviePageCount: 1, personPageCount: 1 });
    assert.match((await readSitemapSnapshot(sitemapSnapshotKey('sitemap-index'))) || '', /\/sitemaps\/movies-0/);
    assert.match((await readSitemapSnapshot(sitemapSnapshotKey('core'))) || '', /https:\/\/www\.movieflix\.site/);
    assert.match((await readSitemapSnapshot(sitemapSnapshotKey('movies-0'))) || '', /\/watch\/test-0/);
    assert.match((await readSitemapSnapshot(sitemapSnapshotKey('people-0'))) || '', /\/person\/test-0/);

    const indexRoute = await readFile(path.resolve('src/app/sitemap.xml/route.ts'), 'utf8');
    const shardRoute = await readFile(path.resolve('src/app/sitemaps/[id]/route.ts'), 'utf8');
    const warmScript = await readFile(path.resolve('scripts/warm-sitemap-cache.ts'), 'utf8');
    assert.match(indexRoute, /sitemapSnapshotKey\('sitemap-index'\)/);
    assert.match(shardRoute, /sitemapSnapshotKey\(id\)/);
    assert.match(warmScript, /warmSitemapSnapshots\(/);
  } finally {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('pterodactyl release scripts and prisma config load .env.production.local and use port 5060', async () => {
  const prepareScript = await readFile(path.resolve('deploy/pterodactyl/prepare-release.sh'), 'utf8');
  const startScript = await readFile(path.resolve('deploy/pterodactyl/start-release.sh'), 'utf8');
  const prismaConfig = await readFile(path.resolve('prisma.config.ts'), 'utf8');
  const tunnelExample = await readFile(path.resolve('deploy/cloudflare/config.example.yml'), 'utf8');

  assert.equal(prepareScript.includes('\r'), false, 'prepare-release.sh must use LF line endings');
  assert.equal(startScript.includes('\r'), false, 'start-release.sh must use LF line endings');
  assert.match(prismaConfig, /\.env\.production\.local/);
  assert.match(prepareScript, /pnpm install --frozen-lockfile --prod=false/);
  assert.match(prepareScript, /tsx --env-file=\.env\.production\.local scripts\/warm-sitemap-cache\.ts/);
  assert.match(prepareScript, /release-sha\.txt/);
  assert.match(startScript, /bash "\$\(dirname "\$0"\)\/prepare-release\.sh"/);
  assert.match(startScript, /node --env-file=\.env\.production\.local server\.js/);
  assert.match(startScript, /release-sha\.txt/);
  assert.match(tunnelExample, /:5060\b/);
  assert.doesNotMatch(tunnelExample, /:5075\b/);
});
