import assert from 'node:assert/strict';
import test from 'node:test';
import { runBoundedQueries } from '../src/lib/bounded-queries';

test('homepage queries preserve their result order while limiting database concurrency', async () => {
  let active = 0;
  let maximum = 0;
  const tasks = Array.from({ length: 7 }, (_, index) => async () => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5 * (7 - index)));
    active--;
    return index;
  });

  assert.deepEqual(await runBoundedQueries(tasks, 2), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(maximum, 2);
});

test('homepage query failures propagate without starting the remaining queued work', async () => {
  let started = 0;
  await assert.rejects(
    runBoundedQueries([
      async () => { started++; throw new Error('database unavailable'); },
      async () => { started++; await new Promise((resolve) => setTimeout(resolve, 10)); },
      async () => { started++; },
    ], 2),
    /database unavailable/,
  );
  assert.equal(started, 2);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(started, 2);
});
