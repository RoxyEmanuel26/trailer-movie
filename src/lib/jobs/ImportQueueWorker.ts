import { ImportRepository } from '@/lib/repositories/ImportRepository';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { PersonImportPipeline } from './pipelines/PersonImportPipeline';
import { ImportBatchService } from '@/lib/services/ImportBatchService';
import { ImportQualityService } from '@/lib/services/ImportQualityService';
import { logger } from '@/lib/logger';

export type ImportWorkerSummary = {
  claimed: number;
  completed: number;
  partial: number;
  failed: number;
  deferred: number;
  remaining: number;
  readyRemaining: number;
  busy: boolean;
  discoveryProcessed: boolean;
  qualityProcessed: number;
  qualityUnpublished: number;
};

export class ImportQueueWorker {
  private isProcessing = false;

  async processNextBatch(): Promise<ImportWorkerSummary> {
    const empty: ImportWorkerSummary = {
      claimed: 0, completed: 0, partial: 0, failed: 0, deferred: 0, remaining: 0,
      readyRemaining: 0, busy: false,
      discoveryProcessed: false, qualityProcessed: 0, qualityUnpublished: 0,
    };
    if (this.isProcessing) {
      const [overview, readyRemaining] = await Promise.all([
        ImportRepository.getOverview(),
        ImportRepository.countReadyForProcessing(),
      ]);
      return {
        ...empty,
        busy: true,
        remaining: overview.stats.queued + overview.stats.partial + overview.stats.running,
        readyRemaining,
      };
    }
    this.isProcessing = true;

    try {
      await Promise.all([ImportRepository.recoverExpiredLeases(), ImportBatchService.recoverStuck()]);
      const discovery = await ImportBatchService.processNextPage().catch((error) => {
        logger.warn({ err: error }, '[ImportQueueWorker] Bulk discovery page deferred');
        return { processed: false };
      });

      const [movieJobs, personJobs] = await Promise.all([
        ImportRepository.claimJobs('Movie', 2),
        ImportRepository.claimJobs('Person', 4),
      ]);
      const jobs = [
        ...movieJobs.map((job) => ({ ...job, kind: 'Movie' as const })),
        ...personJobs.map((job) => ({ ...job, kind: 'Person' as const })),
      ];

      await Promise.allSettled(jobs.map(async (job) => {
        if (job.kind === 'Movie') await new MovieImportPipeline(job.id).run({ tmdbId: job.tmdbId });
        else await new PersonImportPipeline(job.id).run({ tmdbId: job.tmdbId });
      }));

      const states = jobs.length
        ? await Promise.all(jobs.map((job) => ImportRepository.findById(job.id)))
        : [];
      const quality = process.env.IMPORT_QUALITY_BACKFILL_ENABLED === 'true'
        ? await ImportQualityService.refreshLegacyBatch(250)
        : { processed: 0, unpublished: 0, remaining: false };
      await ImportRepository.cleanupCompleted(90);
      const [overview, readyRemaining] = await Promise.all([
        ImportRepository.getOverview(),
        ImportRepository.countReadyForProcessing(),
      ]);

      return {
        claimed: jobs.length,
        completed: states.filter((job) => job?.status === 'COMPLETED').length,
        partial: states.filter((job) => job?.status === 'PARTIAL').length,
        failed: states.filter((job) => job?.status === 'FAILED').length,
        deferred: states.filter((job) => job?.status === 'PENDING').length,
        remaining: overview.stats.queued + overview.stats.partial + overview.stats.running,
        readyRemaining,
        busy: false,
        discoveryProcessed: discovery.processed,
        qualityProcessed: quality.processed,
        qualityUnpublished: quality.unpublished,
      };
    } catch (error) {
      logger.error({ err: error }, '[ImportQueueWorker] Critical error during polling');
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const importQueueWorker = new ImportQueueWorker();
