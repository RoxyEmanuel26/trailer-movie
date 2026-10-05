import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { Prisma } from '@prisma/client';
import { Client } from 'pg';
import { AnalyticsRepository } from '../src/lib/repositories/AnalyticsRepository';

function fakeDatabase(recorded: boolean) {
  const queries: Prisma.Sql[] = [];
  return {
    queries,
    $transaction: () => { throw new Error('Interactive transactions must not be used for analytics'); },
    $queryRaw: async (query: Prisma.Sql) => {
      queries.push(query);
      return [{ recorded, metric_recorded: recorded }];
    },
  };
}

test('page view and daily count use one parameterized atomic statement', async () => {
  const db = fakeDatabase(true);
  const result = await AnalyticsRepository.recordEventAndMetric({
    eventName: 'page_view',
    metric: 'page_view',
    metadata: { path: "/movies?search='unsafe'" },
  }, db);

  assert.equal(result, true);
  assert.equal(db.queries.length, 1);
  const query = db.queries[0];
  assert.match(query.text, /WITH inserted AS \(\s*INSERT INTO "analytics_events"/);
  assert.match(query.text, /INSERT INTO "daily_metrics"/);
  assert.match(query.text, /FROM inserted/);
  assert.match(query.text, /ON CONFLICT \("date", "metric", "entityType", "entityId"\)/);
  assert.equal(query.text.includes("unsafe"), false);
  assert.ok(query.values.includes(JSON.stringify({ path: "/movies?search='unsafe'" })));
});

test('a duplicate qualified view does not increment its metric', async () => {
  const db = fakeDatabase(false);
  const result = await AnalyticsRepository.recordEventAndMetric({
    eventName: 'qualified_movie_view',
    metric: 'qualified_movie_view',
    entityType: 'Movie',
    entityId: 'movie-1',
    dedupeKey: 'same-browser-and-day',
  }, db);

  assert.equal(result, false);
  assert.equal(db.queries.length, 1);
  assert.match(db.queries[0].text, /ON CONFLICT \("dedupeKey"\) DO NOTHING/);
  assert.ok(db.queries[0].values.includes('same-browser-and-day'));
});

test('an event without a daily metric only inserts its event', async () => {
  const queries: Prisma.Sql[] = [];
  const db = {
    $queryRaw: async (query: Prisma.Sql) => {
      queries.push(query);
      return [{ '?column?': 1 }];
    },
  };
  assert.equal(await AnalyticsRepository.recordEventAndMetric({ eventName: 'test' }, db), true);
  assert.equal(queries.length, 1);
  assert.equal(queries[0].text.includes('daily_metrics'), false);
});

test('PostgreSQL records once and rolls the isolated test data back', {
  skip: process.env.ANALYTICS_DB_INTEGRATION !== 'true',
}, async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const metric = `analytics_test_${randomUUID()}`;
  const dedupeKey = `analytics_test_${randomUUID()}`;
  await client.connect();
  try {
    await client.query('BEGIN');
    const db = {
      $queryRaw: async (query: Prisma.Sql) => (await client.query(query.text, [...query.values])).rows,
    };
    const input = { eventName: metric, metric, dedupeKey };
    assert.equal(await AnalyticsRepository.recordEventAndMetric(input, db), true);
    assert.equal(await AnalyticsRepository.recordEventAndMetric(input, db), false);

    const events = await client.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM "analytics_events" WHERE "dedupeKey" = $1',
      [dedupeKey],
    );
    const metrics = await client.query<{ value: number }>(
      'SELECT "value" FROM "daily_metrics" WHERE "metric" = $1',
      [metric],
    );
    assert.equal(events.rows[0].count, 1);
    assert.equal(metrics.rows[0].value, 1);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});
