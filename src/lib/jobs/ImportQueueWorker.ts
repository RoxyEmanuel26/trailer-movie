import { prisma } from '@/lib/prisma';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { ImportJobStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export class ImportQueueWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private CONCURRENCY_LIMIT = 5;
  private isProcessing = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('[ImportQueueWorker] Started polling every 10s');
    
    // Poll every 10 seconds
    this.intervalId = setInterval(() => {
      this.poll().catch(err => logger.error('[ImportQueueWorker] Poll error:', err));
    }, 10000);

    // Initial poll
    this.poll().catch(err => logger.error('[ImportQueueWorker] Initial poll error:', err));
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('[ImportQueueWorker] Stopped');
  }

  private async poll() {
    // Avoid overlapping polls
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Recover stuck jobs (IN_PROGRESS for > 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await prisma.importJob.updateMany({
        where: {
          status: ImportJobStatus.IN_PROGRESS,
          updatedAt: { lt: oneHourAgo }
        },
        data: { status: ImportJobStatus.PENDING }
      });

      // 2. Fetch up to CONCURRENCY_LIMIT jobs atomically using FOR UPDATE SKIP LOCKED
      // Prisma doesn't natively support SKIP LOCKED in findMany, so we use queryRaw
      const jobs = await prisma.$queryRaw<{ id: string, tmdbId: number }[]>`
        SELECT id, "tmdbId" 
        FROM "import_jobs" 
        WHERE status = 'PENDING' 
        ORDER BY "createdAt" ASC 
        LIMIT ${this.CONCURRENCY_LIMIT} 
        FOR UPDATE SKIP LOCKED
      `;

      if (jobs.length === 0) return;

      // 3. Mark them as IN_PROGRESS immediately in a single transaction
      const jobIds = jobs.map(j => j.id);
      await prisma.importJob.updateMany({
        where: { id: { in: jobIds } },
        data: { status: ImportJobStatus.IN_PROGRESS }
      });

      console.log(`[ImportQueueWorker] Processing ${jobs.length} jobs:`, jobIds);

      // 4. Process them concurrently up to the limit
      await Promise.allSettled(
        jobs.map(async (job) => {
          try {
            await new MovieImportPipeline(job.id).run({ tmdbId: job.tmdbId });
          } catch (error) {
            console.error(`[ImportQueueWorker] Job ${job.id} failed fundamentally:`, error);
          }
        })
      );
    } catch (error) {
      console.error('[ImportQueueWorker] Critical error during polling:', error);
    }
  }
}

// Singleton instance
export const importQueueWorker = new ImportQueueWorker();
