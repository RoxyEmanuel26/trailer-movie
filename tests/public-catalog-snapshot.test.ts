import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { isTransientDatabaseError } from '../src/lib/database-errors';
import { loadPublicDataWithSnapshot } from '../src/lib/public-catalog-snapshot';

type TestCatalog = { title: string; releaseDate: Date };
const isTestCatalog = (value: unknown): value is TestCatalog =>
  Boolean(value && typeof value === 'object'
    && typeof (value as TestCatalog).title === 'string'
    && (value as TestCatalog).releaseDate instanceof Date);

test('a connection timeout serves the last valid public snapshot and restores dates', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'movieflix-snapshot-test-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  process.env.SITEMAP_CACHE_DIR = root;
  t.after(async () => {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    if (path.dirname(root) === tmpdir() && path.basename(root).startsWith('movieflix-snapshot-test-')) {
      await rm(root, { recursive: true, force: true });
    }
  });

  const catalog = { title: 'Sample film', releaseDate: new Date('2026-01-01T00:00:00.000Z') };
  const live = await loadPublicDataWithSnapshot('test-homepage', async () => catalog, isTestCatalog);
  assert.equal(live.source, 'live');

  const recovered = await loadPublicDataWithSnapshot('test-homepage', async () => {
    throw Object.assign(new Error('timeout exceeded when trying to connect'), { code: 'P1008' });
  }, isTestCatalog);
  assert.equal(recovered.source, 'snapshot');
  assert.equal(recovered.data.title, catalog.title);
  assert.ok(recovered.data.releaseDate instanceof Date);
  assert.equal(recovered.data.releaseDate.toISOString(), catalog.releaseDate.toISOString());

  await assert.rejects(
    loadPublicDataWithSnapshot('test-homepage', async () => {
      throw Object.assign(new Error('invalid query'), { code: 'P2002' });
    }, isTestCatalog),
    /invalid query/,
  );
});

test('a timeout without a valid snapshot remains visible to the caller', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'movieflix-snapshot-test-'));
  const previous = process.env.SITEMAP_CACHE_DIR;
  process.env.SITEMAP_CACHE_DIR = root;
  t.after(async () => {
    if (previous === undefined) delete process.env.SITEMAP_CACHE_DIR;
    else process.env.SITEMAP_CACHE_DIR = previous;
    if (path.dirname(root) === tmpdir() && path.basename(root).startsWith('movieflix-snapshot-test-')) {
      await rm(root, { recursive: true, force: true });
    }
  });

  await assert.rejects(
    loadPublicDataWithSnapshot('missing-homepage', async () => {
      throw Object.assign(new Error('connection timeout'), { code: 'P1008' });
    }, isTestCatalog),
    /connection timeout/,
  );
});

test('only transient database failures qualify for public fallback', () => {
  assert.equal(isTransientDatabaseError({ code: 'P1008' }), true);
  assert.equal(isTransientDatabaseError(new Error('timeout exceeded when trying to connect')), true);
  assert.equal(isTransientDatabaseError({ code: 'P2002', message: 'Unique constraint failed' }), false);
  assert.equal(isTransientDatabaseError(new Error('Cannot read properties of undefined')), false);
});
