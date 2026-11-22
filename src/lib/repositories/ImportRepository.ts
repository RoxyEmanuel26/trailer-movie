import { ImportJobStatus, Prisma, type ImportJob } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

const ACTIVE_STATUSES: ImportJobStatus[] = [ImportJobStatus.PENDING, ImportJobStatus.IN_PROGRESS];
// Use stable string values here instead of runtime enum property reads. During
// Next.js dev hot reload a process can briefly retain the previous generated
// Prisma enum module after a migration, which would otherwise yield undefined.
const HIDDEN_HISTORY_STATUSES: ImportJobStatus[] = ['COMPLETED', 'SKIPPED', 'CANCELED'];
const UNRELEASED_DRAFT_REFRESH_MS = 24 * 60 * 60_000;
const INCOMPLETE_RECENT_DRAFT_REFRESH_MS = 7 * 24 * 60 * 60_000;
const INCOMPLETE_RECENT_WINDOW_MS = 180 * 24 * 60 * 60_000;

export interface ExistingMovieRefreshCandidate {
  tmdbId: number | null;
  status?: string | null;
  deletedAt?: Date | null;
  productionStatus?: string | null;
  releaseDate?: Date | null;
  importQualityStatus?: string | null;
  tmdbSyncedAt?: Date | null;
}

/**
 * Determines whether an existing Movie row in the database should be re-queued
 * during bulk discovery instead of skipped. Prevents movies imported before
 * their theatrical release ("Post Production" / "Planned") from staying stuck
 * in DRAFT forever once TMDB marks them as "Released" or adds trailers/posters.
 */
export function shouldRefreshExistingMovie(
  movie: ExistingMovieRefreshCandidate,
  now: Date = new Date(),
): boolean {
  if (movie.status !== 'DRAFT' || movie.deletedAt) return false;
  if (!movie.releaseDate || movie.releaseDate > now) return false;

  const syncedAtMs = movie.tmdbSyncedAt ? movie.tmdbSyncedAt.getTime() : 0;
  const ageMs = now.getTime() - syncedAtMs;

  if (movie.productionStatus?.toLowerCase() !== 'released') {
    return !movie.tmdbSyncedAt || ageMs >= UNRELEASED_DRAFT_REFRESH_MS;
  }

  if (
    movie.importQualityStatus === 'INCOMPLETE' &&
    now.getTime() - movie.releaseDate.getTime() <= INCOMPLETE_RECENT_WINDOW_MS
  ) {
    return !movie.tmdbSyncedAt || ageMs >= INCOMPLETE_RECENT_DRAFT_REFRESH_MS;
  }

  return false;
}

export class ImportRepository {
  static async enqueueMoviesForBatch(tmdbIds: number[], importBatchId: string, db: DbClient = prisma) {
    const uniqueIds = [...new Set(tmdbIds.filter((id) => Number.isSafeInteger(id) && id > 0))];
    if (uniqueIds.length === 0) return { queued: 0, skipped: 0 };

    const now = new Date();
    const existingMovies = await db.movie.findMany({
      where: { tmdbId: { in: uniqueIds } },
      select: {
        tmdbId: true,
        status: true,
        deletedAt: true,
        productionStatus: true,
        releaseDate: true,
        importQualityStatus: true,
        tmdbSyncedAt: true,
      },
    });
    const existingByTmdbId = new Map<number, ExistingMovieRefreshCandidate>();
    for (const movie of existingMovies) {
      if (typeof movie.tmdbId === 'number') existingByTmdbId.set(movie.tmdbId, movie);
    }

    const newIds: number[] = [];
    const refreshIds: number[] = [];
    for (const tmdbId of uniqueIds) {
      const existing = existingByTmdbId.get(tmdbId);
      if (!existing) {
        newIds.push(tmdbId);
      } else if (shouldRefreshExistingMovie(existing, now)) {
        refreshIds.push(tmdbId);
      }
    }

    const candidateIds = [...newIds, ...refreshIds];
    const created = candidateIds.length > 0
      ? await db.importJob.createMany({
          data: candidateIds.map((tmdbId) => ({
            tmdbId,
            entityType: 'Movie',
            status: ImportJobStatus.PENDING,
            importBatchId,
          })),
          skipDuplicates: true,
        })
      : { count: 0 };

    let resetCount = 0;
    if (refreshIds.length > 0 && typeof (db.importJob as { updateMany?: unknown }).updateMany === 'function') {
      const reset = await db.importJob.updateMany({
        where: {
          entityType: 'Movie',
          tmdbId: { in: refreshIds },
          status: { in: [ImportJobStatus.COMPLETED, ImportJobStatus.SKIPPED, ImportJobStatus.CANCELED] },
          OR: [{ errorCode: null }, { errorCode: { notIn: ['TMDB_404', 'NON_RETRYABLE'] } }],
        },
        data: {
          status: ImportJobStatus.PENDING,
          stage: 'QUEUED',
          progress: 0,
          attemptCount: 0,
          retryable: true,
          nextAttemptAt: null,
          startedAt: null,
          heartbeatAt: null,
          lockedUntil: null,
          completedAt: null,
          errorCode: null,
          errorMessage: null,
          result: Prisma.DbNull,
          logs: Prisma.DbNull,
          importBatchId,
        },
      });
      resetCount = reset.count;
    }

    const totalQueued = created.count + resetCount;
    return {
      queued: totalQueued,
      // Published/archived/deleted/fresh movies, active jobs, concurrent inserts,
      // and duplicate TMDB IDs are skipped without creating duplicate queue records.
      skipped: Math.max(0, uniqueIds.length - totalQueued),
    };
  }

  /**
   * Automatically finds DRAFT movies whose release date has already passed while
   * still recorded as non-Released (e.g. Post Production / Planned from an early
   * bulk import) and re-queues them for TMDB sync — prioritizing movies whose
   * only quality blocker is `tmdb_not_released` and highest popularity first.
   */
  static async enqueueNewlyReleasedDrafts(
    options: { limit?: number; staleHours?: number; lookbackDays?: number } = {},
    db: DbClient = prisma,
  ) {
    const safeLimit = Math.min(Math.max(1, Math.floor(options.limit ?? 400)), 2000);
    const staleHours = Math.max(1, options.staleHours ?? 72);
    const lookbackDays = Math.max(1, options.lookbackDays ?? 365);
    const now = new Date();
    const staleBefore = new Date(now.getTime() - staleHours * 60 * 60_000);
    const lookbackStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60_000);

    const rows = await db.$queryRaw<Array<{ tmdbId: number }>>(Prisma.sql`
      SELECT "tmdbId"
      FROM "movies"
      WHERE "status" = 'DRAFT'
        AND "deletedAt" IS NULL
        AND "tmdbId" IS NOT NULL
        AND "releaseDate" IS NOT NULL
        AND "releaseDate" <= ${now}
        AND "releaseDate" >= ${lookbackStart}
        AND ("productionStatus" IS NULL OR LOWER("productionStatus") <> 'released')
        AND ("tmdbSyncedAt" IS NULL OR "tmdbSyncedAt" < ${staleBefore})
      ORDER BY
        CASE WHEN "importQualityIssues"::text = '["tmdb_not_released"]' THEN 0 ELSE 1 END ASC,
        "popularity" DESC NULLS LAST,
        "releaseDate" DESC
      LIMIT ${safeLimit}
    `);

    const tmdbIds = [...new Set(rows.map((row) => Number(row.tmdbId)).filter((id) => Number.isSafeInteger(id) && id > 0))];
    if (tmdbIds.length === 0) {
      return { candidates: 0, queued: 0 };
    }

    const created = await db.importJob.createMany({
      data: tmdbIds.map((tmdbId) => ({
        tmdbId,
        entityType: 'Movie',
        status: ImportJobStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    const reset = await db.importJob.updateMany({
      where: {
        entityType: 'Movie',
        tmdbId: { in: tmdbIds },
        status: { in: [ImportJobStatus.COMPLETED, ImportJobStatus.SKIPPED, ImportJobStatus.CANCELED] },
        OR: [{ errorCode: null }, { errorCode: { notIn: ['TMDB_404', 'NON_RETRYABLE'] } }],
      },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        progress: 0,
        attemptCount: 0,
        retryable: true,
        nextAttemptAt: null,
        startedAt: null,
        heartbeatAt: null,
        lockedUntil: null,
        completedAt: null,
        errorCode: null,
        errorMessage: null,
        result: Prisma.DbNull,
        logs: Prisma.DbNull,
      },
    });

    return {
      candidates: tmdbIds.length,
      queued: created.count + reset.count,
    };
  }

  static async enqueue(tmdbId: number, entityType = 'Movie', forceRefresh = false, db: DbClient = prisma, importBatchId?: string) {
    const job = await db.importJob.upsert({
      where: { tmdbId_entityType: { tmdbId, entityType } },
      create: { tmdbId, entityType, status: ImportJobStatus.PENDING, importBatchId },
      update: {},
    });
    if (ACTIVE_STATUSES.includes(job.status)) return job;
    if (!forceRefresh && job.status === ImportJobStatus.COMPLETED) return job;
    return db.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportJobStatus.PENDING, stage: 'QUEUED', progress: 0, attemptCount: 0,
        retryable: true, nextAttemptAt: null, startedAt: null, heartbeatAt: null,
        lockedUntil: null, completedAt: null, errorCode: null, errorMessage: null,
        result: Prisma.DbNull, logs: Prisma.DbNull, ...(importBatchId && { importBatchId }),
      },
    });
  }

  static async create(tmdbId: number, entityType = 'Movie', db: DbClient = prisma) {
    return this.enqueue(tmdbId, entityType, true, db);
  }

  static async updateStatus(id: string, status: ImportJobStatus, logs?: unknown, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id },
      data: { status, ...(logs !== undefined && { logs: logs === null ? Prisma.DbNull : (logs as Prisma.InputJsonValue) }) },
    });
  }

  static async updateProgress(id: string, stage: string, progress: number, logs?: Prisma.InputJsonValue, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id },
      data: {
        stage, progress: Math.min(100, Math.max(0, progress)), heartbeatAt: new Date(),
        lockedUntil: new Date(Date.now() + 10 * 60_000), ...(logs !== undefined && { logs }),
      },
    });
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.importJob.findUnique({ where: { id } });
  }

  static async findStatuses(ids: string[], db: DbClient = prisma) {
    if (ids.length === 0) return [];
    return db.importJob.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  }

  static async enqueuePersons(tmdbIds: number[], db: DbClient = prisma) {
    const uniqueIds = [...new Set(tmdbIds.filter((id) => Number.isSafeInteger(id) && id > 0))];
    if (uniqueIds.length === 0) return;
    const staleBefore = new Date(Date.now() - 90 * 86_400_000);
    let candidateIds = uniqueIds;
    if ((db as { person?: typeof prisma.person }).person?.findMany) {
      const freshPeople = await db.person.findMany({
        where: { tmdbId: { in: uniqueIds }, tmdbSyncedAt: { gte: staleBefore } },
        select: { tmdbId: true },
      });
      const freshSet = new Set(
        freshPeople.flatMap((person) => (typeof person.tmdbId === 'number' ? [person.tmdbId] : [])),
      );
      candidateIds = uniqueIds.filter((id) => !freshSet.has(id));
      if (candidateIds.length === 0) return;
    }
    await db.importJob.createMany({
      data: candidateIds.map((tmdbId) => ({ tmdbId, entityType: 'Person', status: ImportJobStatus.PENDING })),
      skipDuplicates: true,
    });
    await db.importJob.updateMany({
      where: {
        entityType: 'Person', tmdbId: { in: candidateIds },
        OR: [
          { status: { in: [ImportJobStatus.FAILED, ImportJobStatus.PARTIAL] }, retryable: true },
          {
            status: ImportJobStatus.COMPLETED,
            OR: [{ completedAt: null }, { completedAt: { lt: staleBefore } }],
          },
        ],
      },
      data: {
        status: ImportJobStatus.PENDING, stage: 'QUEUED', progress: 0, attemptCount: 0,
        retryable: true, nextAttemptAt: null, startedAt: null, heartbeatAt: null,
        lockedUntil: null, completedAt: null, errorCode: null, errorMessage: null,
        result: Prisma.DbNull, logs: Prisma.DbNull,
      },
    });
  }

  static async findActivJobByTmdbId(tmdbId: number, db: DbClient = prisma) {
    return db.importJob.findFirst({ where: { tmdbId, entityType: 'Movie', status: { in: ACTIVE_STATUSES } } });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.importJob.delete({ where: { id } });
  }

  static async list(params: { skip?: number; take?: number; status?: ImportJobStatus; entityType?: string; stage?: string; retryable?: boolean; includeCompleted?: boolean; includeTotal?: boolean }, db: DbClient = prisma) {
    const where: Prisma.ImportJobWhereInput = {
      ...(params.status
        ? { status: params.status }
        : !params.includeCompleted && { status: { notIn: HIDDEN_HISTORY_STATUSES } }),
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.stage && { stage: params.stage }),
      ...(params.retryable !== undefined && { retryable: params.retryable }),
    };
    // Monitoring only needs a bounded list. Avoid repeatedly counting a million
    // history rows, and do not occupy two pool slots for one list request.
    const take = Math.min(params.take || 50, 100);
    // Prisma casts text parameters to enums. PostgreSQL cannot prove those
    // stable casts imply our partial-index predicate, so it scans history.
    // Keep this fixed predicate literal; every user-supplied filter stays bound.
    const activeOnly = !params.status && !params.includeCompleted;
    const conditions = [Prisma.sql`"status" NOT IN ('COMPLETED', 'SKIPPED', 'CANCELED')`];
    if (params.entityType) conditions.push(Prisma.sql`"entityType" = ${params.entityType}`);
    if (params.stage) conditions.push(Prisma.sql`"stage" = ${params.stage}`);
    if (params.retryable !== undefined) conditions.push(Prisma.sql`"retryable" = ${params.retryable}`);
    const data = activeOnly
      ? await db.$queryRaw<ImportJob[]>(Prisma.sql`
          SELECT * FROM "public"."import_jobs"
          WHERE ${Prisma.join(conditions, ' AND ')}
          ORDER BY "updatedAt" DESC, "id" DESC LIMIT ${take} OFFSET ${params.skip || 0}
        `)
      : await db.importJob.findMany({
          skip: params.skip, take, where,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
    const total = params.includeTotal === false ? null : await db.importJob.count({ where });
    return { data, total };
  }

  static async getOverview(db: DbClient = prisma) {
    const [counts, recentJobs] = await Promise.all([
      db.importJob.groupBy({ by: ['status'], _count: { _all: true } }),
      db.importJob.findMany({ take: 20, orderBy: { updatedAt: 'desc' } }),
    ]);
    const byStatus = new Map(counts.map(({ status, _count }) => [status, _count._all]));
    return {
      stats: {
        queued: byStatus.get(ImportJobStatus.PENDING) || 0,
        running: byStatus.get(ImportJobStatus.IN_PROGRESS) || 0,
        partial: byStatus.get(ImportJobStatus.PARTIAL) || 0,
        completed: byStatus.get(ImportJobStatus.COMPLETED) || 0,
        failed: byStatus.get(ImportJobStatus.FAILED) || 0,
      },
      recentJobs,
    };
  }

  static async getWorkerState(db: DbClient = prisma) {
    const rows = await db.$queryRaw<Array<{ remaining: bigint | number; ready: bigint | number }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (
          WHERE status IN ('PENDING', 'IN_PROGRESS')
            OR (status = 'PARTIAL' AND retryable = true)
        ) AS remaining,
        COUNT(*) FILTER (
          WHERE status IN ('PENDING', 'PARTIAL')
            AND retryable = true
            AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= CURRENT_TIMESTAMP)
        ) AS ready
      FROM "import_jobs"
      WHERE status IN ('PENDING', 'PARTIAL', 'IN_PROGRESS')
    `);
    return {
      remaining: Number(rows[0]?.remaining || 0),
      ready: Number(rows[0]?.ready || 0),
    };
  }

  static async countReadyForProcessing(db: DbClient = prisma) {
    return db.importJob.count({
      where: {
        status: { in: [ImportJobStatus.PENDING, ImportJobStatus.PARTIAL] },
        retryable: true,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
    });
  }

  static async recoverExpiredLeases(db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        status: ImportJobStatus.IN_PROGRESS,
        OR: [{ lockedUntil: { lt: new Date() } }, { lockedUntil: null, updatedAt: { lt: new Date(Date.now() - 10 * 60_000) } }],
      },
      data: { status: ImportJobStatus.PENDING, stage: 'QUEUED', lockedUntil: null, nextAttemptAt: new Date() },
    });
  }

  static async recoverStuckJobs(_thresholdDate?: Date, db: DbClient = prisma) {
    return this.recoverExpiredLeases(db);
  }

  static async recoverMisclassifiedTimeouts(db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        status: ImportJobStatus.FAILED,
        retryable: false,
        errorCode: 'UNKNOWN',
        errorMessage: { contains: 'timed out', mode: 'insensitive' },
      },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        retryable: true,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        errorCode: 'UPSTREAM_TIMEOUT',
      },
    });
  }

  static async recoverMisclassifiedDictionaryRaces(db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        status: ImportJobStatus.FAILED,
        retryable: false,
        errorCode: 'P2002',
        OR: [
          { errorMessage: { contains: 'tx.keyword.create', mode: 'insensitive' } },
          { errorMessage: { contains: 'tx.productionCompany.create', mode: 'insensitive' } },
        ],
      },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        retryable: true,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        errorCode: 'DB_UNIQUE_RACE',
      },
    });
  }

  static async claimJobs(entityType: 'Movie' | 'Person', limit: number) {
    return prisma.$queryRaw<Array<{ id: string; tmdbId: number; entityType: string; attemptCount: number }>>(Prisma.sql`
      UPDATE "import_jobs"
      SET status = 'IN_PROGRESS', stage = 'CLAIMED', progress = GREATEST(progress, 1),
          "attemptCount" = "attemptCount" + 1, "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP),
          "heartbeatAt" = CURRENT_TIMESTAMP, "lockedUntil" = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM "import_jobs"
        WHERE status IN ('PENDING', 'PARTIAL') AND "retryable" = true
          AND "entityType" = ${entityType}
          AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= CURRENT_TIMESTAMP)
        ORDER BY "createdAt" ASC LIMIT ${limit} FOR UPDATE SKIP LOCKED
      )
      RETURNING id, "tmdbId", "entityType", "attemptCount"
    `);
  }

  static async fetchJobsForProcessing(limit: number) { return this.claimJobs('Movie', limit); }

  static async complete(id: string, result?: Prisma.InputJsonValue, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id },
      data: {
        status: ImportJobStatus.COMPLETED, stage: 'COMPLETED', progress: 100, retryable: false,
        completedAt: new Date(), heartbeatAt: new Date(), lockedUntil: null, nextAttemptAt: null,
        errorCode: null, errorMessage: null, ...(result !== undefined && { result }),
      },
    });
  }

  static async skip(id: string, input: { code: string; message: string; logs?: Prisma.InputJsonValue }, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id },
      data: {
        status: ImportJobStatus.SKIPPED, stage: 'SKIPPED', progress: 100, retryable: false,
        completedAt: new Date(), heartbeatAt: new Date(), lockedUntil: null, nextAttemptAt: null,
        errorCode: input.code, errorMessage: input.message.slice(0, 10_000),
        ...(input.logs !== undefined && { logs: input.logs }),
      },
    });
  }

  static async cancelPendingForBatch(importBatchId: string, db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        importBatchId,
        status: { in: [ImportJobStatus.PENDING, ImportJobStatus.PARTIAL] },
      },
      data: {
        status: ImportJobStatus.CANCELED, stage: 'CANCELED', progress: 100,
        retryable: false, completedAt: new Date(), lockedUntil: null, nextAttemptAt: null,
        errorCode: 'BATCH_CANCELED', errorMessage: 'Canceled by an administrator before processing started.',
      },
    });
  }

  static async fail(id: string, input: { code: string; message: string; retryable: boolean; nextAttemptAt?: Date; partial?: boolean; logs?: Prisma.InputJsonValue }, db: DbClient = prisma) {
    const nextStatus = input.retryable
      ? input.partial
        ? ImportJobStatus.PARTIAL
        : ImportJobStatus.PENDING
      : ImportJobStatus.FAILED;
    return db.importJob.update({
      where: { id },
      data: {
        status: nextStatus,
        retryable: input.retryable, nextAttemptAt: input.nextAttemptAt || null, lockedUntil: null,
        heartbeatAt: new Date(), errorCode: input.code, errorMessage: input.message.slice(0, 10_000),
        ...(input.logs !== undefined && { logs: input.logs }),
      },
    });
  }

  static async retryAllFailed(db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: {
        status: { in: [ImportJobStatus.FAILED, ImportJobStatus.PARTIAL] },
        OR: [
          { retryable: true },
          { errorCode: null },
          { errorCode: { notIn: ['TMDB_404', 'NON_RETRYABLE'] } },
        ],
      },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        attemptCount: 0,
        retryable: true,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  static async retry(id: string, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id, status: { in: [ImportJobStatus.FAILED, ImportJobStatus.PARTIAL] } },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        attemptCount: 0,
        retryable: true,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  static async cleanupCompleted(retentionDays = 14, db: DbClient = prisma) {
    return db.importJob.deleteMany({
      where: {
        status: { in: [ImportJobStatus.COMPLETED, ImportJobStatus.SKIPPED, ImportJobStatus.CANCELED] },
        completedAt: { lt: new Date(Date.now() - retentionDays * 86_400_000) },
      },
    });
  }
}
