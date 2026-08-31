import { ImportRepository } from '@/lib/repositories/ImportRepository';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { logger } from '@/lib/logger';

export class ImportQueueWorker {
  private isProcessing = false;

  async processNextBatch(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    const startTime = Date.now();
    const MAX_EXECUTION_TIME_MS = 270 * 1000;
    let totalProcessed = 0;

    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await ImportRepository.recoverStuckJobs(tenMinutesAgo);

      while (Date.now() - startTime < MAX_EXECUTION_TIME_MS) {
        const jobs = await ImportRepository.fetchJobsForProcessing(2);

        if (jobs.length === 0) {
          break;
        }

        logger.info({ jobIds: jobs.map(j => j.id) }, '[ImportQueueWorker] Processing ' + jobs.length + ' jobs');

        await Promise.allSettled(
          jobs.map(async (job) => {
            try {
              await new MovieImportPipeline(job.id).run({ tmdbId: job.tmdbId });
            } catch (error) {
              logger.error({ err: error, jobId: job.id }, '[ImportQueueWorker] Job ' + job.id + ' failed fundamentally');
            }
          })
        );
        
        totalProcessed += jobs.length;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return totalProcessed;
    } catch (error) {
      logger.error({ err: error }, '[ImportQueueWorker] Critical error during polling');
      return totalProcessed;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const importQueueWorker = new ImportQueueWorker();
