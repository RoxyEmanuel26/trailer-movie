import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportBatchSchema } from '../src/lib/api/schemas';
import { classifyJobError } from '../src/lib/jobs/error-classification';
import { NonRetryableJobError, PartialJobError, RetryableJobError } from '../src/lib/jobs/retry';
import { evaluateLegacyMovieQuality, evaluateMovieQuality } from '../src/lib/services/ImportQualityService';
import { TmdbError } from '../src/lib/tmdb/errors';
import { getImportThroughput, runBounded } from '../src/lib/jobs/throughput';
import { ImportRepository } from '../src/lib/repositories/ImportRepository';
import { ImportJobStatus } from '@prisma/client';
import { safeUpsertCompany, safeUpsertKeyword } from '../src/lib/services/import-service';
import { ImportBatchService } from '../src/lib/services/ImportBatchService';

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
  assert.equal(classifyJobError({ code: 'P2028', message: 'expired transaction' }).retryable, true);
  assert.equal(classifyJobError({ code: 'P2002', message: 'unique constraint' }).retryable, false);
  assert.deepEqual(classifyJobError({ statusCode: 504, message: 'Request to api.themoviedb.org timed out after 10000ms.' }), {
    code: 'UPSTREAM_TIMEOUT',
    message: 'Request to api.themoviedb.org timed out after 10000ms.',
    retryable: true,
  });
  assert.equal(classifyJobError(new Error('The upstream request timed out')).retryable, true);
});

test('bulk discovery rejects invalid date ranges and country codes', () => {
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-02-30', endDate: '2026-03-01' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-02', endDate: '2026-03-01' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-01', endDate: '2026-03-02', country: 'id' }).success, false);
  assert.equal(ImportBatchSchema.safeParse({ startDate: '2026-03-01', endDate: '2026-03-02', country: 'ID' }).success, true);
});

test('import worker uses VPS-safe batch defaults with bounded concurrency', () => {
  assert.deepEqual(getImportThroughput({}), {
    movieBatchSize: 20,
    personBatchSize: 40,
    movieConcurrency: 4,
    personConcurrency: 8,
  });
  assert.deepEqual(getImportThroughput({
    IMPORT_MOVIE_BATCH_SIZE: '3', IMPORT_PERSON_BATCH_SIZE: '4',
    IMPORT_MOVIE_CONCURRENCY: '10', IMPORT_PERSON_CONCURRENCY: '10',
  }), {
    movieBatchSize: 3, personBatchSize: 4, movieConcurrency: 3, personConcurrency: 4,
  });
  assert.equal(getImportThroughput({ IMPORT_MOVIE_BATCH_SIZE: '-1' }).movieBatchSize, 20);
  assert.equal(getImportThroughput({ IMPORT_PERSON_BATCH_SIZE: '1000' }).personBatchSize, 40);
});

test('bounded runner never exceeds its concurrency and retains failed results', async () => {
  let active = 0;
  let peak = 0;
  const results = await runBounded([1, 2, 3, 4, 5, 6], 2, async (value) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    if (value === 4) throw new Error('test failure');
  });
  assert.equal(peak, 2);
  assert.deepEqual(results.map((result) => result.status), [
    'fulfilled', 'fulfilled', 'fulfilled', 'rejected', 'fulfilled', 'fulfilled',
  ]);
});

test('person bulk enqueue deduplicates IDs without requeueing recently completed or permanent jobs', async () => {
  const calls: Array<{ operation: string; args: unknown }> = [];
  const db = {
    importJob: {
      createMany: async (args: unknown) => { calls.push({ operation: 'createMany', args }); },
      updateMany: async (args: unknown) => { calls.push({ operation: 'updateMany', args }); },
    },
  } as unknown as NonNullable<Parameters<typeof ImportRepository.enqueuePersons>[1]>;
  await ImportRepository.enqueuePersons([976, 976, 31, -1, 0], db);
  assert.equal(calls.length, 2);
  assert.deepEqual((calls[0].args as { data: Array<{ tmdbId: number }> }).data.map((job) => job.tmdbId), [976, 31]);
  const filter = (calls[1].args as { where: { OR: Array<Record<string, unknown>> } }).where.OR;
  assert.deepEqual(filter[0], { status: { in: ['FAILED', 'PARTIAL'] }, retryable: true });
  assert.equal(filter[1].status, 'COMPLETED');
});

test('movie bulk discovery enqueues unique new IDs with one createMany call', async () => {
  const calls: unknown[] = [];
  const db = {
    movie: {
      findMany: async () => [{ tmdbId: 20 }],
    },
    importJob: {
      createMany: async (args: unknown) => {
        calls.push(args);
        return { count: 2 };
      },
    },
  } as unknown as NonNullable<Parameters<typeof ImportRepository.enqueueMoviesForBatch>[2]>;

  const result = await ImportRepository.enqueueMoviesForBatch([10, 20, 10, 30, -1], 'batch-1', db);
  assert.deepEqual(result, { queued: 2, skipped: 1 });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    data: [
      { tmdbId: 10, entityType: 'Movie', status: ImportJobStatus.PENDING, importBatchId: 'batch-1' },
      { tmdbId: 30, entityType: 'Movie', status: ImportJobStatus.PENDING, importBatchId: 'batch-1' },
    ],
    skipDuplicates: true,
  });
});

test('movie bulk discovery counts a concurrent duplicate insert as skipped', async () => {
  const db = {
    movie: { findMany: async () => [] },
    importJob: { createMany: async () => ({ count: 1 }) },
  } as unknown as NonNullable<Parameters<typeof ImportRepository.enqueueMoviesForBatch>[2]>;

  assert.deepEqual(
    await ImportRepository.enqueueMoviesForBatch([10, 20], 'batch-1', db),
    { queued: 1, skipped: 1 },
  );
});

test('legacy failed P2028 batches are recovered without touching other failures', async () => {
  let captured: unknown;
  const db = {
    importBatch: {
      updateMany: async (args: unknown) => {
        captured = args;
        return { count: 1 };
      },
    },
  } as unknown as NonNullable<Parameters<typeof ImportBatchService.recoverMisclassifiedTransactionTimeouts>[0]>;

  const result = await ImportBatchService.recoverMisclassifiedTransactionTimeouts(db);
  assert.equal(result.count, 1);
  const input = captured as {
    where: { status: string; errorMessage: { startsWith: string; contains: string; mode: string } };
    data: { status: string; nextRunAt: Date; completedAt: null; errorMessage: null };
  };
  assert.deepEqual(input.where, {
    status: 'FAILED',
    errorMessage: { startsWith: '[P2028]', contains: 'expired transaction', mode: 'insensitive' },
  });
  assert.equal(input.data.status, 'PENDING');
  assert.ok(input.data.nextRunAt instanceof Date);
  assert.equal(input.data.completedAt, null);
  assert.equal(input.data.errorMessage, null);
});

test('queue listing excludes completed history unless it is explicitly requested', async () => {
  const capturedWhere: unknown[] = [];
  const db = {
    importJob: {
      findMany: async ({ where }: { where: unknown }) => {
        capturedWhere.push(where);
        return [];
      },
      count: async ({ where }: { where: unknown }) => {
        capturedWhere.push(where);
        return 0;
      },
    },
  } as unknown as NonNullable<Parameters<typeof ImportRepository.list>[1]>;

  await ImportRepository.list({ take: 50, includeCompleted: false }, db);
  assert.deepEqual(capturedWhere[0], { status: { notIn: ['COMPLETED', 'SKIPPED', 'CANCELED'] } });
  assert.deepEqual(capturedWhere[1], { status: { notIn: ['COMPLETED', 'SKIPPED', 'CANCELED'] } });

  capturedWhere.length = 0;
  await ImportRepository.list({ take: 50, status: ImportJobStatus.COMPLETED }, db);
  assert.deepEqual(capturedWhere[0], { status: ImportJobStatus.COMPLETED });
});

test('legacy UNKNOWN timeout jobs are made retryable without touching other failures', async () => {
  let captured: unknown;
  const db = {
    importJob: {
      updateMany: async (args: unknown) => {
        captured = args;
        return { count: 1 };
      },
    },
  } as unknown as NonNullable<Parameters<typeof ImportRepository.recoverMisclassifiedTimeouts>[0]>;
  const result = await ImportRepository.recoverMisclassifiedTimeouts(db);
  assert.equal(result.count, 1);
  assert.deepEqual(captured, {
    where: {
      status: 'FAILED',
      retryable: false,
      errorCode: 'UNKNOWN',
      errorMessage: { contains: 'timed out', mode: 'insensitive' },
    },
    data: {
      status: 'PENDING',
      stage: 'QUEUED',
      retryable: true,
      nextAttemptAt: (captured as { data: { nextAttemptAt: Date } }).data.nextAttemptAt,
      lockedUntil: null,
      errorCode: 'UPSTREAM_TIMEOUT',
    },
  });
  assert.ok((captured as { data: { nextAttemptAt: unknown } }).data.nextAttemptAt instanceof Date);
});

test('keyword creation tolerates a concurrent insert without emitting P2002', async () => {
  const created = { id: 'keyword-1', tmdbId: 123, name: 'Time travel' };
  let lookupCount = 0;
  let createManyArgs: unknown;
  const db = {
    keyword: {
      findUnique: async () => (++lookupCount === 1 ? null : created),
      findFirst: async () => null,
      createMany: async (args: unknown) => {
        createManyArgs = args;
        return { count: 0 };
      },
    },
  };
  assert.equal(await safeUpsertKeyword(db, { id: 123, name: 'Time travel' }), created);
  assert.deepEqual(createManyArgs, {
    data: [{ name: 'Time travel', tmdbId: 123 }],
    skipDuplicates: true,
  });
});

test('production-company creation tolerates a concurrent insert without emitting P2002', async () => {
  const created = { id: 'company-1', tmdbId: 456, name: 'Studio', logoUrl: null, slug: 'studio-456' };
  let tmdbLookupCount = 0;
  let createManyArgs: unknown;
  const db = {
    productionCompany: {
      findUnique: async ({ where }: { where: { tmdbId?: number; slug?: string } }) => {
        if (where.tmdbId) return ++tmdbLookupCount === 1 ? null : created;
        return null;
      },
      findFirst: async () => null,
      createMany: async (args: unknown) => {
        createManyArgs = args;
        return { count: 0 };
      },
    },
  };
  assert.equal(await safeUpsertCompany(db, { id: 456, name: 'Studio' }), created);
  assert.deepEqual(createManyArgs, {
    data: [{ name: 'Studio', tmdbId: 456, logoUrl: null, slug: 'studio-456' }],
    skipDuplicates: true,
  });
});
