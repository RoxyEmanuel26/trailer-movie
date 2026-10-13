import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hasValidRevalidationSecret, isAllowedRevalidationPath } from '../src/lib/revalidation';
import { generateSitemapWithFallback, readSitemapSnapshot } from '../src/lib/sitemap-cache';
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
