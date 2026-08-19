import { ImportRepository } from '@/lib/repositories/ImportRepository';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { logger } from '@/lib/logger';

export class ImportQueueWorker {
  private CONCURRENCY_LIMIT = 5;
  private isProcessing = false;

  async processNextBatch() {
    // Avoid overlapping polls within the same instance/request
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Recover stuck jobs (IN_PROGRESS for > 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await ImportRepository.recoverStuckJobs(oneHourAgo);

      // 2. Fetch up to CONCURRENCY_LIMIT jobs atomically using FOR UPDATE SKIP LOCKED
      const jobs = await ImportRepository.fetchJobsForProcessing(this.CONCURRENCY_LIMIT);

      if (jobs.length === 0) {
        return;
      }

      // 3. Mark them as IN_PROGRESS immediately in a single transaction
      const jobIds = jobs.map(j => j.id);
      await ImportRepository.markJobsInProgress(jobIds);

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
    } finally {
      this.isProcessing = false;
    }
  }
}

// Singleton instance
export const importQueueWorker = new ImportQueueWorker();
