import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseConnectionTimeout } from '../src/lib/db-connection-settings';
import { getEffectiveDatabaseUrl } from '../src/lib/prisma';

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

test('getEffectiveDatabaseUrl routes nano-1.nurahost.com to internal container network on linux', () => {
  const originalPlatform = process.platform;
  try {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    const input = 'postgresql://user:pass@nano-1.nurahost.com:5112/movieflix?schema=public';
    const resolved = getEffectiveDatabaseUrl(input);
    assert.match(resolved, /461b710f-642a-4ea8-af0a-668edcfa5d6a\.pterodactyl_nw:5112/);

    const nonProvider = 'postgresql://user:pass@other.example.com:5432/movieflix';
    assert.equal(getEffectiveDatabaseUrl(nonProvider), nonProvider);
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  }
});
