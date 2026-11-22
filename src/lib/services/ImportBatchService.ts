import { ImportBatchStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { tmdbFetch } from '../tmdb/client';
import { ImportRepository } from '../repositories/ImportRepository';
import { calculateRetryAt, classifyJobError } from '../jobs/error-classification';
import { DbClient } from '../repositories/base.types';
import { NotFoundError, ValidationError } from '../errors';

export type CreateImportBatchInput = { startDate: string; endDate: string; country?: string };

export class ImportBatchService {
  static async create(input: CreateImportBatchInput) {
    return prisma.importBatch.create({
      data: {
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        endDate: new Date(`${input.endDate}T00:00:00.000Z`),
        countryCode: input.country || null,
        nextRunAt: new Date(),
      },
    });
  }

  static async list() {
    return prisma.importBatch.findMany({ take: 40, orderBy: { createdAt: 'desc' } });
  }

  static async getWorkState(db: DbClient = prisma) {
    const rows = await db.$queryRaw<Array<{
      remaining: bigint | number;
      ready: bigint | number;
      nextRunAt: Date | null;
    }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('PENDING', 'RUNNING')) AS remaining,
        COUNT(*) FILTER (
          WHERE status = 'PENDING'
            AND ("nextRunAt" IS NULL OR "nextRunAt" <= CURRENT_TIMESTAMP)
        ) AS ready,
        MIN("nextRunAt") FILTER (
          WHERE status = 'PENDING' AND "nextRunAt" IS NOT NULL
        ) AS "nextRunAt"
      FROM "import_batches"
      WHERE status IN ('PENDING', 'RUNNING')
    `);
    return {
      remaining: Number(rows[0]?.remaining || 0),
      ready: Number(rows[0]?.ready || 0),
      nextRunAt: rows[0]?.nextRunAt ?? null,
    };
  }

  static async find(id: string) {
    return prisma.importBatch.findUnique({ where: { id } });
  }

  static async pause(id: string) {
    const existing = await this.find(id);
    if (!existing) {
      throw new NotFoundError(`Bulk import batch not found: ${id}`);
    }
    const updated = await prisma.importBatch.updateMany({
      where: { id, status: { in: [ImportBatchStatus.PENDING, ImportBatchStatus.RUNNING] } },
      data: { status: ImportBatchStatus.PAUSED, nextRunAt: null },
    });
    if (updated.count === 0) {
      throw new ValidationError(`Cannot pause bulk import batch in status ${existing.status}`);
    }
    return this.find(id);
  }

  static async resume(id: string) {
    const existing = await this.find(id);
    if (!existing) {
      throw new NotFoundError(`Bulk import batch not found: ${id}`);
    }
    const updated = await prisma.importBatch.updateMany({
      where: { id, status: ImportBatchStatus.PAUSED },
      data: { status: ImportBatchStatus.PENDING, nextRunAt: new Date(), errorMessage: null, completedAt: null },
    });
    if (updated.count === 0) {
      throw new ValidationError(`Cannot resume bulk import batch in status ${existing.status}`);
    }
    return this.find(id);
  }

  static async cancel(id: string) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.importBatch.findUnique({ where: { id }, select: { status: true } });
      if (!batch) {
        throw new NotFoundError(`Bulk import batch not found: ${id}`);
      }
      const terminalStatuses: ImportBatchStatus[] = [ImportBatchStatus.COMPLETED, ImportBatchStatus.FAILED, ImportBatchStatus.CANCELED];
      if (terminalStatuses.includes(batch.status)) {
        return tx.importBatch.findUnique({ where: { id } });
      }
      await ImportRepository.cancelPendingForBatch(id, tx);
      return tx.importBatch.update({
        where: { id },
        data: {
          status: ImportBatchStatus.CANCELED,
          nextRunAt: null,
          canceledAt: new Date(),
          completedAt: new Date(),
          errorMessage: null,
        },
      });
    });
  }

  static async finalizeImporting(db: DbClient = prisma) {
    const batches = await db.importBatch.findMany({
      where: { status: ImportBatchStatus.IMPORTING },
      select: { id: true },
    });
    if (batches.length === 0) return 0;

    const counts = await db.importJob.groupBy({
      by: ['importBatchId', 'status', 'retryable'],
      where: { importBatchId: { in: batches.map((batch) => batch.id) } },
      _count: { _all: true },
    });
    const byBatch = new Map<string, { completed: number; failed: number; skipped: number; active: number }>();
    for (const row of counts as Array<{ importBatchId: string | null; status: string; retryable?: boolean; _count: { _all: number } }>) {
      if (!row.importBatchId) continue;
      const summary = byBatch.get(row.importBatchId) || { completed: 0, failed: 0, skipped: 0, active: 0 };
      const count = row._count._all;
      if (row.status === 'COMPLETED') summary.completed += count;
      else if (row.status === 'FAILED') summary.failed += count;
      else if (row.status === 'SKIPPED') summary.skipped += count;
      else if (row.status === 'PENDING' || row.status === 'IN_PROGRESS') summary.active += count;
      else if (row.status === 'PARTIAL') {
        if (row.retryable === false) summary.failed += count;
        else summary.active += count;
      }
      byBatch.set(row.importBatchId, summary);
    }

    let finalized = 0;
    for (const batch of batches) {
      const summary = byBatch.get(batch.id) || { completed: 0, failed: 0, skipped: 0, active: 0 };
      const importedCount = summary.completed;
      const failedCount = summary.failed;
      const unavailableCount = summary.skipped;
      const stillRunning = summary.active > 0;
      const updateData = {
        importedCount,
        failedCount,
        unavailableCount,
        ...(stillRunning ? {} : {
          status: failedCount > 0 ? ImportBatchStatus.FAILED : ImportBatchStatus.COMPLETED,
          completedAt: new Date(),
          errorMessage: failedCount > 0 ? `${failedCount} movie import job(s) require attention.` : null,
        }),
      };
      if (typeof (db.importBatch as any).updateMany === 'function') {
        const res = await db.importBatch.updateMany({
          where: { id: batch.id, status: ImportBatchStatus.IMPORTING },
          data: updateData,
        });
        if (!stillRunning && res.count > 0) finalized += 1;
      } else {
        await db.importBatch.update({
          where: { id: batch.id },
          data: updateData,
        });
        if (!stillRunning) finalized += 1;
      }
    }
    return finalized;
  }

  static async claimNext(allowEarlyClaim = false) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      allowEarlyClaim
        ? Prisma.sql`
            UPDATE "import_batches"
            SET status = 'RUNNING', "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
            WHERE id IN (
              SELECT id FROM "import_batches"
              WHERE status = 'PENDING'
              ORDER BY "nextRunAt" ASC NULLS FIRST, "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED
            ) RETURNING id
          `
        : Prisma.sql`
            UPDATE "import_batches"
            SET status = 'RUNNING', "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
            WHERE id IN (
              SELECT id FROM "import_batches"
              WHERE status = 'PENDING' AND ("nextRunAt" IS NULL OR "nextRunAt" <= CURRENT_TIMESTAMP)
              ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED
            ) RETURNING id
          `,
    );
    return rows[0] ? this.find(rows[0].id) : null;
  }

  static async recoverStuck() {
    return prisma.importBatch.updateMany({
      where: { status: ImportBatchStatus.RUNNING, updatedAt: { lt: new Date(Date.now() - 10 * 60_000) } },
      data: { status: ImportBatchStatus.PENDING, nextRunAt: new Date() },
    });
  }

  static async recoverMisclassifiedTransactionTimeouts(db: DbClient = prisma) {
    return db.importBatch.updateMany({
      where: {
        status: ImportBatchStatus.FAILED,
        errorMessage: {
          startsWith: '[P2028]',
          contains: 'expired transaction',
          mode: 'insensitive',
        },
      },
      data: {
        status: ImportBatchStatus.PENDING,
        nextRunAt: new Date(),
        completedAt: null,
        errorMessage: null,
      },
    });
  }

  static async processNextPage(options?: { allowEarlyClaim?: boolean }) {
    const batch = await this.claimNext(Boolean(options?.allowEarlyClaim));
    if (!batch) return { processed: false, queued: 0, skipped: 0 };

    try {
      const response = await tmdbFetch<any>('/discover/movie', {
        params: {
          'primary_release_date.gte': batch.startDate.toISOString().slice(0, 10),
          'primary_release_date.lte': batch.endDate.toISOString().slice(0, 10),
          sort_by: 'primary_release_date.desc',
          page: batch.currentPage,
          language: 'en-US',
          ...(batch.countryCode && { with_origin_country: batch.countryCode }),
        },
      });
      const movies: Array<{ id?: unknown }> = Array.isArray(response.results) ? response.results : [];
      const ids = [...new Set<number>(
        movies.map((movie) => movie.id)
          .filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0),
      )];
      const totalPages = Math.min(Number(response.total_pages) || 1, 500);
      const completed = batch.currentPage >= totalPages;
      const pageResult = await prisma.$transaction(async (tx) => {
        // Pause/cancel can be requested while the TMDB request is in flight.
        // Holding this check and all page writes in one transaction guarantees
        // that cancel either wins before this page or cancels every job created
        // by it immediately afterwards.
        const current = await tx.importBatch.findUnique({ where: { id: batch.id }, select: { status: true } });
        if (current?.status !== ImportBatchStatus.RUNNING) return null;

        const { queued, skipped } = await ImportRepository.enqueueMoviesForBatch(ids, batch.id, tx);

        await tx.importBatch.update({
          where: { id: batch.id },
          data: {
            totalPages,
            currentPage: completed ? batch.currentPage : batch.currentPage + 1,
            queuedCount: { increment: queued },
            skippedCount: { increment: skipped },
            status: completed ? ImportBatchStatus.IMPORTING : ImportBatchStatus.PENDING,
            completedAt: null,
            nextRunAt: completed ? null : new Date(Date.now() + (queued > 0 ? 2_000 : 500)),
            errorMessage: null,
          },
        });
        return { queued, skipped };
      }, { maxWait: 10_000, timeout: 20_000 });
      if (!pageResult) return { processed: false, batchId: batch.id, queued: 0, skipped: 0, completed: false };
      return { processed: true, batchId: batch.id, ...pageResult, completed };
    } catch (error) {
      const classified = classifyJobError(error);
      await prisma.importBatch.updateMany({
        where: { id: batch.id, status: ImportBatchStatus.RUNNING },
        data: {
          status: classified.retryable ? ImportBatchStatus.PENDING : ImportBatchStatus.FAILED,
          nextRunAt: classified.retryable ? calculateRetryAt(2, classified.retryAfterSeconds) : null,
          completedAt: classified.retryable ? null : new Date(),
          errorMessage: `[${classified.code}] ${classified.message}`.slice(0, 10_000),
        },
      });
      throw error;
    }
  }
}
