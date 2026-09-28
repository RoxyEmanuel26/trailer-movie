import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hasValidRevalidationSecret, isAllowedRevalidationPath } from '../src/lib/revalidation';
import { generateSitemapWithFallback } from '../src/lib/sitemap-cache';

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
