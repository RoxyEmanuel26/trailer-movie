import { ImportRepository } from '@/lib/repositories/ImportRepository';
import { MovieImportPipeline } from './pipelines/MovieImportPipeline';
import { PersonImportPipeline } from './pipelines/PersonImportPipeline';
import { ImportBatchService } from '@/lib/services/ImportBatchService';
import { ImportQualityService } from '@/lib/services/ImportQualityService';
import { logger } from '@/lib/logger';
import { getImportThroughput, runBounded } from './throughput';

export type ImportWorkerSummary = {
  claimed: number;
  completed: number;
  skipped: number;
  partial: number;
  failed: number;
  deferred: number;
  remaining: number;
  readyRemaining: number;
  busy: boolean;
  discoveryProcessed: boolean;
  discoveryRemaining: number;
  discoveryReady: number;
  nextDiscoveryAt: Date | null;
  qualityProcessed: number;
  qualityUnpublished: number;
};

export class ImportQueueWorker {
  private isProcessing = false;

  async processNextBatch(): Promise<ImportWorkerSummary> {
    const empty: ImportWorkerSummary = {
      claimed: 0, completed: 0, skipped: 0, partial: 0, failed: 0, deferred: 0, remaining: 0,
      readyRemaining: 0, busy: false,
      discoveryProcessed: false, discoveryRemaining: 0, discoveryReady: 0,
      nextDiscoveryAt: null, qualityProcessed: 0, qualityUnpublished: 0,
    };
    if (this.isProcessing) {
      const [overview, readyRemaining, discoveryState] = await Promise.all([
        ImportRepository.getOverview(),
        ImportRepository.countReadyForProcessing(),
        ImportBatchService.getWorkState(),
      ]);
      return {
        ...empty,
        busy: true,
        remaining: overview.stats.queued + overview.stats.partial + overview.stats.running,
        readyRemaining,
        discoveryRemaining: discoveryState.remaining,
        discoveryReady: discoveryState.ready,
        nextDiscoveryAt: discoveryState.nextRunAt,
      };
    }
    this.isProcessing = true;

    try {
      const throughput = getImportThroughput();
      await Promise.all([ImportRepository.recoverExpiredLeases(), ImportBatchService.recoverStuck()]);
      const discoveryPromise = ImportBatchService.processNextPage().catch((error) => {
        logger.warn({ err: error }, '[ImportQueueWorker] Bulk discovery page deferred');
        return { processed: false };
      });

      const [movieJobs, personJobs] = await Promise.all([
        ImportRepository.claimJobs('Movie', throughput.movieBatchSize),
        ImportRepository.claimJobs('Person', throughput.personBatchSize),
      ]);
      const jobs = [...movieJobs, ...personJobs];
      const [movieResults, personResults, discovery] = await Promise.all([
        runBounded(movieJobs, throughput.movieConcurrency, (job) => new MovieImportPipeline(job.id).run({ tmdbId: job.tmdbId })),
        runBounded(personJobs, throughput.personConcurrency, (job) => new PersonImportPipeline(job.id).run({ tmdbId: job.tmdbId })),
        discoveryPromise,
      ]);
      for (const failure of [...movieResults, ...personResults]) {
        if (failure.status === 'rejected') logger.error({ err: failure.reason }, '[ImportQueueWorker] Failed to persist job outcome');
      }

      const states = await ImportRepository.findStatuses(jobs.map((job) => job.id));
      const quality = process.env.IMPORT_QUALITY_BACKFILL_ENABLED === 'true'
        ? await ImportQualityService.refreshLegacyBatch(250)
        : { processed: 0, unpublished: 0, remaining: false };
      await ImportRepository.cleanupCompleted(90);
      await ImportBatchService.finalizeImporting();
      const [overview, readyRemaining, discoveryState] = await Promise.all([
        ImportRepository.getOverview(),
        ImportRepository.countReadyForProcessing(),
        ImportBatchService.getWorkState(),
      ]);

      return {
        claimed: jobs.length,
        completed: states.filter((job) => job?.status === 'COMPLETED').length,
        skipped: states.filter((job) => job?.status === 'SKIPPED').length,
        partial: states.filter((job) => job?.status === 'PARTIAL').length,
        failed: states.filter((job) => job?.status === 'FAILED').length,
        deferred: states.filter((job) => job?.status === 'PENDING').length,
        remaining: overview.stats.queued + overview.stats.partial + overview.stats.running,
        readyRemaining,
        busy: false,
        discoveryProcessed: discovery.processed,
        discoveryRemaining: discoveryState.remaining,
        discoveryReady: discoveryState.ready,
        nextDiscoveryAt: discoveryState.nextRunAt,
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
