import { ImportBatchStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { tmdbFetch } from '../tmdb/client';
import { ImportRepository } from '../repositories/ImportRepository';
import { calculateRetryAt, classifyJobError } from '../jobs/error-classification';

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
    return prisma.importBatch.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
  }

  static async find(id: string) {
    return prisma.importBatch.findUnique({ where: { id } });
  }

  static async pause(id: string) {
    return prisma.importBatch.update({ where: { id }, data: { status: ImportBatchStatus.PAUSED } });
  }

  static async resume(id: string) {
    return prisma.importBatch.update({
      where: { id },
      data: { status: ImportBatchStatus.PENDING, nextRunAt: new Date(), errorMessage: null, completedAt: null },
    });
  }

  static async claimNext() {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE "import_batches"
      SET status = 'RUNNING', "startedAt" = COALESCE("startedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM "import_batches"
        WHERE status = 'PENDING' AND ("nextRunAt" IS NULL OR "nextRunAt" <= CURRENT_TIMESTAMP)
        ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED
      ) RETURNING id
    `);
    return rows[0] ? this.find(rows[0].id) : null;
  }

  static async recoverStuck() {
    return prisma.importBatch.updateMany({
      where: { status: ImportBatchStatus.RUNNING, updatedAt: { lt: new Date(Date.now() - 10 * 60_000) } },
      data: { status: ImportBatchStatus.PENDING, nextRunAt: new Date() },
    });
  }

  static async processNextPage() {
    const batch = await this.claimNext();
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
      const movies = Array.isArray(response.results) ? response.results : [];
      const ids = movies.map((movie: any) => movie.id).filter((id: unknown): id is number => Number.isSafeInteger(id));
      const [existingMovies, existingJobs] = await Promise.all([
        prisma.movie.findMany({ where: { tmdbId: { in: ids } }, select: { tmdbId: true } }),
        prisma.importJob.findMany({
          where: { tmdbId: { in: ids }, entityType: 'Movie' },
          select: { tmdbId: true },
        }),
      ]);
      const existingIds = new Set([
        ...existingMovies.map((movie) => movie.tmdbId),
        ...existingJobs.map((job) => job.tmdbId),
      ]);
      let queued = 0;
      let skipped = 0;
      for (const tmdbId of ids) {
        if (existingIds.has(tmdbId)) { skipped += 1; continue; }
        await ImportRepository.enqueue(tmdbId, 'Movie');
        queued += 1;
      }

      const totalPages = Math.min(Number(response.total_pages) || 1, 500);
      const completed = batch.currentPage >= totalPages;
      await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          totalPages,
          currentPage: completed ? batch.currentPage : batch.currentPage + 1,
          queuedCount: { increment: queued },
          skippedCount: { increment: skipped },
          status: completed ? ImportBatchStatus.COMPLETED : ImportBatchStatus.PENDING,
          completedAt: completed ? new Date() : null,
          nextRunAt: completed ? null : new Date(Date.now() + 5_000),
          errorMessage: null,
        },
      });
      return { processed: true, batchId: batch.id, queued, skipped, completed };
    } catch (error) {
      const classified = classifyJobError(error);
      await prisma.importBatch.update({
        where: { id: batch.id },
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
