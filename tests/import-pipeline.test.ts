import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportBatchSchema } from '../src/lib/api/schemas';
import { classifyJobError } from '../src/lib/jobs/error-classification';
import { NonRetryableJobError, PartialJobError, RetryableJobError } from '../src/lib/jobs/retry';
import { evaluateLegacyMovieQuality, evaluateMovieQuality } from '../src/lib/services/ImportQualityService';
import { TmdbError } from '../src/lib/tmdb/errors';

const completeMovie = {
  title: 'Complete movie',
  releaseDate: new Date('2026-01-01T00:00:00.000Z'),
  synopsis: 'A complete synopsis.',
  posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  productionStatus: 'Released',
  youtubeTrailerId: 'video-id',
  genreCount: 1,
  activeYoutubeTrailerCount: 0,
};

test('new imports publish only when every quality requirement is present', () => {
  assert.deepEqual(evaluateMovieQuality(completeMovie), []);
  assert.deepEqual(
    evaluateMovieQuality({ ...completeMovie, synopsis: null, genreCount: 0, youtubeTrailerId: null }),
    ['missing_synopsis', 'missing_genre', 'missing_trailer'],
  );
});

test('an active YouTube trailer record satisfies the trailer quality gate', () => {
  assert.deepEqual(evaluateMovieQuality({ ...completeMovie, youtubeTrailerId: null, activeYoutubeTrailerCount: 1 }), []);
});

test('legacy quality gate checks only poster and effective trailer', () => {
  assert.deepEqual(
    evaluateLegacyMovieQuality({ posterUrl: null, youtubeTrailerId: null, activeYoutubeTrailerCount: 0 }),
    ['missing_poster', 'missing_trailer'],
  );
  assert.deepEqual(
    evaluateLegacyMovieQuality({ posterUrl: 'poster.jpg', youtubeTrailerId: null, activeYoutubeTrailerCount: 1 }),
    [],
  );
});

test('retry classification distinguishes permanent, transient, and partial errors', () => {
  assert.equal(classifyJobError(new NonRetryableJobError('invalid')).retryable, false);
  assert.equal(classifyJobError(new RetryableJobError('temporary')).retryable, true);
  assert.deepEqual(classifyJobError(new TmdbError(404, 'Not found')), {
    code: 'TMDB_404',
    message: 'TMDB API Error (404): Not found',
    retryable: false,
  });
  assert.deepEqual(classifyJobError(new PartialJobError('reviews unavailable')), {
    code: 'PARTIAL_IMPORT',
    message: 'reviews unavailable',
    retryable: true,
  });
  assert.equal(classifyJobError({ code: 'P2024', message: 'connection pool timeout' }).retryable, true);
  assert.equal(classifyJobError({ code: 'P2002', message: 'unique constraint' }).retryable, false);
});

test('bulk discovery rejects invalid date ranges and country codes', () => {
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-02-30', endDate: '2026-03-01' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-02', endDate: '2026-03-01' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-01', endDate: '2026-03-02', country: 'id' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-01', endDate: '2026-03-02', country: 'ID' }).success, true);
});
