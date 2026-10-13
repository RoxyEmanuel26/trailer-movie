import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseConnectionTimeout } from '../src/lib/db-connection-settings';

test('public database pool defaults to a bounded wait', () => {
  assert.equal(databaseConnectionTimeout(undefined), 8_000);
  assert.equal(databaseConnectionTimeout('5000'), 5_000);
  assert.equal(databaseConnectionTimeout('30000'), 30_000);
});

test('invalid pool timeouts cannot cause indefinite or immediate failures', () => {
  for (const value of ['0', '-1', 'Infinity', 'not-a-number', '999999']) {
    assert.equal(databaseConnectionTimeout(value), 8_000);
  }
});
