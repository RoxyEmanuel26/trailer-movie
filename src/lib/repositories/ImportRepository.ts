import { ImportJobStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

const ACTIVE_STATUSES: ImportJobStatus[] = [ImportJobStatus.PENDING, ImportJobStatus.IN_PROGRESS];
// Use stable string values here instead of runtime enum property reads. During
// Next.js dev hot reload a process can briefly retain the previous generated
// Prisma enum module after a migration, which would otherwise yield undefined.
const HIDDEN_HISTORY_STATUSES: ImportJobStatus[] = ['COMPLETED', 'SKIPPED', 'CANCELED'];

export class ImportRepository {
  static async enqueueMoviesForBatch(tmdbIds: number[], importBatchId: string, db: DbClient = prisma) {
    const uniqueIds = [...new Set(tmdbIds.filter((id) => Number.isSafeInteger(id) && id > 0))];
    if (uniqueIds.length === 0) return { queued: 0, skipped: 0 };

    const existingMovies = await db.movie.findMany({
      where: { tmdbId: { in: uniqueIds } },
      select: { tmdbId: true },
    });
    const existingMovieIds = new Set(existingMovies.map((movie) => movie.tmdbId));
    const candidateIds = uniqueIds.filter((tmdbId) => !existingMovieIds.has(tmdbId));
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

    return {
      queued: created.count,
      // Existing movies, existing jobs, concurrent inserts, and duplicate TMDB
      // IDs are all skipped without creating duplicate queue records.
      skipped: uniqueIds.length - created.count,
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
    await db.importJob.createMany({
      data: uniqueIds.map((tmdbId) => ({ tmdbId, entityType: 'Person', status: ImportJobStatus.PENDING })),
      skipDuplicates: true,
    });
    await db.importJob.updateMany({
      where: {
        entityType: 'Person', tmdbId: { in: uniqueIds },
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

  static async list(params: { skip?: number; take?: number; status?: ImportJobStatus; entityType?: string; stage?: string; retryable?: boolean; includeCompleted?: boolean }, db: DbClient = prisma) {
    const where: Prisma.ImportJobWhereInput = {
      ...(params.status
        ? { status: params.status }
        : !params.includeCompleted && { status: { notIn: HIDDEN_HISTORY_STATUSES } }),
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.stage && { stage: params.stage }),
      ...(params.retryable !== undefined && { retryable: params.retryable }),
    };
    const [data, total] = await Promise.all([
      db.importJob.findMany({ skip: params.skip, take: params.take, where, orderBy: { updatedAt: 'desc' } }),
      db.importJob.count({ where }),
    ]);
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
          WHERE status IN ('PENDING', 'PARTIAL', 'IN_PROGRESS')
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
    return db.importJob.update({
      where: { id },
      data: {
        status: input.partial ? ImportJobStatus.PARTIAL : input.retryable ? ImportJobStatus.PENDING : ImportJobStatus.FAILED,
        retryable: input.retryable, nextAttemptAt: input.nextAttemptAt || null, lockedUntil: null,
        heartbeatAt: new Date(), errorCode: input.code, errorMessage: input.message.slice(0, 10_000),
        ...(input.logs !== undefined && { logs: input.logs }),
      },
    });
  }

  static async retryAllFailed(db: DbClient = prisma) {
    return db.importJob.updateMany({
      where: { status: { in: [ImportJobStatus.FAILED, ImportJobStatus.PARTIAL] }, retryable: true },
      data: { status: ImportJobStatus.PENDING, stage: 'QUEUED', attemptCount: 0, nextAttemptAt: new Date(), lockedUntil: null, errorCode: null, errorMessage: null },
    });
  }

  static async retry(id: string, db: DbClient = prisma) {
    return db.importJob.update({
      where: { id, status: { in: [ImportJobStatus.FAILED, ImportJobStatus.PARTIAL] }, retryable: true },
      data: {
        status: ImportJobStatus.PENDING,
        stage: 'QUEUED',
        attemptCount: 0,
        nextAttemptAt: new Date(),
        lockedUntil: null,
        errorCode: null,
        errorMessage: null,
      },
    });
  }

  static async cleanupCompleted(retentionDays = 90, db: DbClient = prisma) {
    return db.importJob.deleteMany({
      where: {
        status: { in: [ImportJobStatus.COMPLETED, ImportJobStatus.SKIPPED, ImportJobStatus.CANCELED] },
        completedAt: { lt: new Date(Date.now() - retentionDays * 86_400_000) },
      },
    });
  }
}
