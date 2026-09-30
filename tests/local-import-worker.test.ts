import assert from 'node:assert/strict';
import test from 'node:test';
import { drainImportQueue } from '../src/lib/jobs/drain-import-queue';
import type { ImportWorkerSummary } from '../src/lib/jobs/ImportQueueWorker';

function summary(overrides: Partial<ImportWorkerSummary> = {}): ImportWorkerSummary {
  return {
    claimed: 0, completed: 0, skipped: 0, partial: 0, failed: 0, deferred: 0,
    remaining: 0, readyRemaining: 0, busy: false, discoveryProcessed: false,
    discoveryRemaining: 0, discoveryReady: 0, nextDiscoveryAt: null,
    qualityProcessed: 0, qualityUnpublished: 0, ...overrides,
  };
}

test('local worker drains all eligible jobs and discovery pages', async () => {
  const batches = [
    summary({ claimed: 2, completed: 2, readyRemaining: 3, discoveryProcessed: true }),
    summary({ claimed: 3, completed: 3, readyRemaining: 0 }),
  ];
  const seen: ImportWorkerSummary[] = [];
  const result = await drainImportQueue({
    processBatch: async () => batches.shift()!,
    shouldStop: () => false,
    onBatch: (batch) => seen.push(batch),
    pause: async () => {},
  });
  assert.equal(result.reason, 'drained');
  assert.equal(result.cycles, 2);
  assert.equal(seen.length, 2);
});

test('local worker does not exit while a bulk discovery batch is waiting for its next page', async () => {
  const batches = [
    summary({ discoveryRemaining: 1, nextDiscoveryAt: new Date(Date.now() + 5_000) }),
    summary({ discoveryProcessed: true, discoveryRemaining: 0 }),
    summary(),
  ];
  const pauses: number[] = [];
  const result = await drainImportQueue({
    processBatch: async () => batches.shift()!,
    shouldStop: () => false,
    onBatch: () => {},
    pause: async (milliseconds) => { pauses.push(milliseconds); },
  });
  assert.equal(result.reason, 'drained');
  assert.equal(result.cycles, 3);
  assert.ok(pauses[0] >= 250);
});

test('watch mode remains alive after an empty cycle and processes work queued later', async () => {
  let stopping = false;
  let calls = 0;
  const result = await drainImportQueue({
    processBatch: async () => {
      calls++;
      if (calls === 1) return summary();
      return summary({ discoveryProcessed: true });
    },
    shouldStop: () => stopping,
    onBatch: (batch) => {
      if (batch.discoveryProcessed) stopping = true;
    },
    pause: async () => {},
    stayAlive: true,
  });
  assert.equal(result.reason, 'stopped');
  assert.equal(calls, 2);
});

test('local worker stops without claiming another batch', async () => {
  let stopping = false;
  let calls = 0;
  const result = await drainImportQueue({
    processBatch: async () => {
      calls++;
      return summary({ claimed: 1, completed: 1, readyRemaining: 5 });
    },
    shouldStop: () => stopping,
    onBatch: () => { stopping = true; },
    pause: async () => {},
  });
  assert.equal(result.reason, 'stopped');
  assert.equal(calls, 1);
});

test('local worker fails visibly if pending work repeatedly makes no progress', async () => {
  let calls = 0;
  await assert.rejects(() => drainImportQueue({
    processBatch: async () => { calls++; return summary({ readyRemaining: 4, remaining: 4 }); },
    shouldStop: () => false,
    onBatch: () => {},
    pause: async () => {},
  }), /no progress/);
  assert.equal(calls, 10);
});

test('local worker retries a transient polling failure with bounded backoff', async () => {
  let calls = 0;
  const pauses: number[] = [];
  const errors: number[] = [];
  const result = await drainImportQueue({
    processBatch: async () => {
      calls++;
      if (calls === 1) throw Object.assign(new Error('socket timeout'), { code: 'P1008' });
      return summary();
    },
    shouldStop: () => false,
    onBatch: () => {},
    onProcessError: (_error, failures) => {
      errors.push(failures);
      return true;
    },
    pause: async (milliseconds) => { pauses.push(milliseconds); },
  });
  assert.equal(result.reason, 'drained');
  assert.equal(calls, 2);
  assert.deepEqual(errors, [1]);
  assert.deepEqual(pauses, [1_000]);
});

test('local worker still surfaces permanent polling failures', async () => {
  await assert.rejects(() => drainImportQueue({
    processBatch: async () => { throw new Error('permanent'); },
    shouldStop: () => false,
    onBatch: () => {},
    onProcessError: () => false,
    pause: async () => {},
  }), /permanent/);
});
