import assert from 'node:assert/strict';
import test from 'node:test';
import { createImportPoller } from '../src/lib/import-poller';
import { readImportMonitoring } from '../src/lib/import-monitoring';
import { ImportRepository } from '../src/lib/repositories/ImportRepository';
import { ImportListSchema } from '../src/lib/api/schemas';
import { apiHandler } from '../src/lib/api/handler';
import { NextRequest } from 'next/server';
import { MovieRepository } from '../src/lib/repositories/MovieRepository';

test('popular hub gets its counts in one query without fetching or ranking movies', async () => {
  const now = new Date('2026-10-12T12:00:00Z');
  let calls = 0;
  const db: any = { $queryRaw: async (query: any) => {
    calls++;
    assert.deepEqual(query.values, [now]);
    assert.match(query.sql, /"status" = 'PUBLISHED' AND "deletedAt" IS NULL/);
    assert.match(query.sql, /"voteAverage" IS NOT NULL AND "voteCount" >= 50/);
    assert.match(query.sql, /"releaseDate" <=/);
    return [{ mostPopular: 9, topRated: 3, latestReleases: 7 }];
  } };
  assert.deepEqual(await MovieRepository.getPopularHubCounts(now, db), { mostPopular: 9, topRated: 3, latestReleases: 7 });
  assert.equal(calls, 1);
});

test('monitoring does not count history and bounds the list', async () => {
  let query: any;
  const db: any = { $queryRaw: async (input: any) => { query = input; return [{ id: 'job' }]; }, importJob: {
    findMany: async () => { throw new Error('Active queue must use the index-compatible query'); },
    count: async () => { throw new Error('Count must not run'); },
  } };
  const result = await ImportRepository.list({ includeTotal: false, take: 1000 }, db);
  assert.equal(result.total, null);
  assert.deepEqual(query.values, [100, 0]);
  assert.match(query.sql, /ORDER BY "updatedAt" DESC, "id" DESC/);
  assert.match(query.sql, /NOT IN \('COMPLETED', 'SKIPPED', 'CANCELED'\)/);
});

test('explicit totals retain compatibility without concurrent pool acquisition', async () => {
  let listFinished = false;
  const db: any = { importJob: {
    findMany: async () => { await Promise.resolve(); listFinished = true; return []; },
    count: async () => { assert.equal(listFinished, true); return 9; },
  } };
  assert.equal((await ImportRepository.list({ includeCompleted: true }, db)).total, 9);
  assert.equal(ImportListSchema.parse({ includeTotal: 'false' }).includeTotal, false);
  assert.equal(ImportListSchema.parse({}).includeTotal, true);
});

test('active queue filters remain parameterized, including hostile strings', async () => {
  let query: any;
  const entityType = "Movie'; DROP TABLE import_jobs; --";
  const db: any = { $queryRaw: async (input: any) => { query = input; return []; } };
  await ImportRepository.list({ includeTotal: false, entityType, stage: 'PERSIST', retryable: false, take: 20, skip: 40 }, db);
  assert.deepEqual(query.values, [entityType, 'PERSIST', false, 20, 40]);
  assert.ok(!query.sql.includes(entityType));
});

test('only transient database errors become unavailable monitoring', async () => {
  assert.equal(await readImportMonitoring(async () => { throw { code: 'P1008' }; }), null);
  assert.equal(await readImportMonitoring(async () => { throw new Error('Connection terminated due to connection timeout'); }), null);
  const error = new Error('Invalid query');
  await assert.rejects(readImportMonitoring(async () => { throw error; }), error);
  const redirect = new Error('NEXT_REDIRECT');
  await assert.rejects(readImportMonitoring(async () => { throw redirect; }), redirect);
});

test('concurrent refreshes share a request and stop prevents stale updates', async () => {
  let calls = 0;
  let signal: AbortSignal | undefined;
  let finish!: (value: number) => void;
  const updates: number[] = [];
  const poller = createImportPoller({
    load: async (input) => { calls++; signal = input; return new Promise<number>((resolve) => { finish = resolve; }); },
    onData: (value) => updates.push(value), onUnavailable: () => {},
  });
  const first = poller.refresh();
  assert.equal(poller.refresh(), first);
  await Promise.resolve();
  assert.equal(calls, 1);
  poller.stop();
  assert.equal(signal?.aborted, true);
  finish(7);
  assert.equal(await first, null);
  assert.deepEqual(updates, []);
});

test('failure preserves data and a subsequent refresh recovers, including synchronous throws', async () => {
  let fail = true;
  const data = [42];
  const unavailable: boolean[] = [];
  const poller = createImportPoller({
    load: () => { if (fail) throw new Error('Network unavailable'); return Promise.resolve(43); },
    onData: (value) => data.push(value), onUnavailable: (value) => unavailable.push(value),
  });
  try {
    assert.equal(await poller.refresh(), null);
    assert.deepEqual(data, [42]);
    fail = false;
    assert.equal(await poller.refresh(), 43);
    assert.deepEqual(data, [42, 43]);
    assert.deepEqual(unavailable, [true, false]);
  } finally { poller.stop(); }
});

test('API returns a retryable no-store 503 without database details', async () => {
  const handler = apiHandler(async () => { throw { code: 'P1008', message: 'private database hostname' }; });
  const response = await handler(new NextRequest('http://localhost/api/admin/imports'), {});
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Retry-After'), '10');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = await response.text();
  assert.ok(body.includes('DATABASE_UNAVAILABLE'));
  assert.ok(!body.includes('private database hostname'));
});

test('scheduled polling never overlaps a slow request', async () => {
  let calls = 0;
  let finish!: (value: number) => void;
  const poller = createImportPoller({
    load: () => { calls++; return new Promise<number>((resolve) => { finish = resolve; }); },
    onData: () => {}, onUnavailable: () => {}, intervalMs: 5,
  });
  try {
    const pending = poller.refresh();
    poller.start(true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(calls, 1);
    poller.stop();
    finish(1);
    await pending;
  } finally { poller.stop(); }
});
