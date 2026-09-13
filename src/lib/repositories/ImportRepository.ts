import { ImportJobStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

const ACTIVE_STATUSES: ImportJobStatus[] = [ImportJobStatus.PENDING, ImportJobStatus.IN_PROGRESS];

export class ImportRepository {
  static async enqueue(tmdbId: number, entityType = 'Movie', forceRefresh = false, db: DbClient = prisma) {
    const job = await db.importJob.upsert({
      where: { tmdbId_entityType: { tmdbId, entityType } },
      create: { tmdbId, entityType, status: ImportJobStatus.PENDING },
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
        result: Prisma.DbNull, logs: Prisma.DbNull,
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

  static async findActivJobByTmdbId(tmdbId: number, db: DbClient = prisma) {
    return db.importJob.findFirst({ where: { tmdbId, entityType: 'Movie', status: { in: ACTIVE_STATUSES } } });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.importJob.delete({ where: { id } });
  }

  static async list(params: { skip?: number; take?: number; status?: ImportJobStatus; entityType?: string; stage?: string; retryable?: boolean }, db: DbClient = prisma) {
    const where: Prisma.ImportJobWhereInput = {
      ...(params.status && { status: params.status }),
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
    const [queued, running, partial, completed, failed, recentJobs] = await Promise.all([
      db.importJob.count({ where: { status: ImportJobStatus.PENDING } }),
      db.importJob.count({ where: { status: ImportJobStatus.IN_PROGRESS } }),
      db.importJob.count({ where: { status: ImportJobStatus.PARTIAL } }),
      db.importJob.count({ where: { status: ImportJobStatus.COMPLETED } }),
      db.importJob.count({ where: { status: ImportJobStatus.FAILED } }),
      db.importJob.findMany({ take: 20, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { stats: { queued, running, partial, completed, failed }, recentJobs };
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
      where: { status: ImportJobStatus.COMPLETED, completedAt: { lt: new Date(Date.now() - retentionDays * 86_400_000) } },
    });
  }
}
