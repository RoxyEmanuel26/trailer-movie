import { ImportRepository } from '@/lib/repositories/ImportRepository';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { logger } from '@/lib/logger';

export class ImportQueueWorker {
  private CONCURRENCY_LIMIT = 5;
  private isProcessing = false;

  async processNextBatch(): Promise<number> {
    // Avoid overlapping polls within the same instance/request
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      // 1. Recover stuck jobs (IN_PROGRESS for > 10 min — aligned with maxDuration=300s + buffer)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await ImportRepository.recoverStuckJobs(tenMinutesAgo);

      // 2. Fetch up to CONCURRENCY_LIMIT jobs atomically using FOR UPDATE SKIP LOCKED
      const jobs = await ImportRepository.fetchJobsForProcessing(this.CONCURRENCY_LIMIT);

      if (jobs.length === 0) {
        return 0;
      }

      // 3. Mark them as IN_PROGRESS immediately in a single transaction (Now handled atomically in fetchJobsForProcessing)
      logger.info({ jobIds: jobs.map(j => j.id) }, `[ImportQueueWorker] Processing ${jobs.length} jobs`);

      // 4. Process them concurrently up to the limit
      await Promise.allSettled(
        jobs.map(async (job) => {
          try {
            await new MovieImportPipeline(job.id).run({ tmdbId: job.tmdbId });
          } catch (error) {
            logger.error({ err: error, jobId: job.id }, `[ImportQueueWorker] Job ${job.id} failed fundamentally`);
          }
        })
      );
      
      return jobs.length;
    } catch (error) {
      logger.error({ err: error }, '[ImportQueueWorker] Critical error during polling');
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton instance
export const importQueueWorker = new ImportQueueWorker();
