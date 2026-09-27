import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseDailyHero, rankTrendingCandidates } from '../src/lib/homepage-ranking';
import { readAnalyticsConsentCookie } from '../src/lib/analytics/consent';
import { createAnalyticsDedupeKey } from '../src/lib/analytics/server';

const now = new Date('2026-09-24T12:00:00.000Z');

test('mature trending ranks qualified engagement above catalog popularity', () => {
  const ranked = rankTrendingCandidates([
    { id: 'engaged', popularity: 10, voteCount: 50, releaseDate: now, views: 30, trailerPlays: 10 },
    { id: 'popular', popularity: 1000, voteCount: 5000, releaseDate: now, views: 0, trailerPlays: 0 },
  ], now);
  assert.equal(ranked[0].id, 'engaged');
  assert.equal(ranked[0].coldStart, false);
});

test('cold-start ranking falls back to strong catalog signals', () => {
  const ranked = rankTrendingCandidates([
    { id: 'popular', popularity: 100, voteCount: 1000, releaseDate: now, views: 1, trailerPlays: 0 },
    { id: 'quiet', popularity: 1, voteCount: 1, releaseDate: now, views: 2, trailerPlays: 0 },
  ], now);
  assert.equal(ranked[0].id, 'popular');
  assert.equal(ranked[0].coldStart, true);
});

test('automatic hero is deterministic for the same UTC day', () => {
  const candidates = Array.from({ length: 12 }, (_, index) => ({
    id: `movie-${index}`,
    popularity: 100 - index,
    voteCount: 100 - index,
    releaseDate: new Date('2026-09-01T00:00:00.000Z'),
    views: 0,
    trailerPlays: 0,
  }));
  assert.equal(chooseDailyHero(candidates, now)?.id, chooseDailyHero(candidates, now)?.id);
});

test('analytics consent parser defaults to unknown and respects explicit choice', () => {
  assert.equal(readAnalyticsConsentCookie('theme=dark'), 'unknown');
  assert.equal(readAnalyticsConsentCookie('theme=dark; movieflix_analytics_consent=denied'), 'denied');
  assert.equal(readAnalyticsConsentCookie('movieflix_analytics_consent=granted'), 'granted');
});

test('analytics dedupe key is stable per movie and day without exposing the anonymous ID', () => {
  process.env.ANALYTICS_HMAC_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
  const input = { anonymousId: 'browser-123', eventName: 'qualified_movie_view', entityId: 'movie-1', date: now };
  const first = createAnalyticsDedupeKey(input);
  const second = createAnalyticsDedupeKey(input);
  const differentMovie = createAnalyticsDedupeKey({ ...input, entityId: 'movie-2' });
  assert.equal(first, second);
  assert.notEqual(first, differentMovie);
  assert.equal(first.includes(input.anonymousId), false);
});
