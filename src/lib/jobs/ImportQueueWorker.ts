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
  private lastRecoveryAt = 0;
  private lastCleanupAt = 0;
  private lastFinalizationAt = 0;
  private lastDiscoveryPollAt = 0;
  private lastDiscoveryStateAt = 0;
  private discoveryState = { remaining: 0, ready: 0, nextRunAt: null as Date | null };

  private async readDiscoveryState(force = false) {
    if (!force && Date.now() - this.lastDiscoveryStateAt < 30_000) return this.discoveryState;
    this.discoveryState = await ImportBatchService.getWorkState();
    this.lastDiscoveryStateAt = Date.now();
    return this.discoveryState;
  }

  async processNextBatch(): Promise<ImportWorkerSummary> {
    const empty: ImportWorkerSummary = {
      claimed: 0, completed: 0, skipped: 0, partial: 0, failed: 0, deferred: 0, remaining: 0,
      readyRemaining: 0, busy: false,
      discoveryProcessed: false, discoveryRemaining: 0, discoveryReady: 0,
      nextDiscoveryAt: null, qualityProcessed: 0, qualityUnpublished: 0,
    };
    if (this.isProcessing) {
      const [workerState, discoveryState] = await Promise.all([
        ImportRepository.getWorkerState(),
        this.readDiscoveryState(),
      ]);
      return {
        ...empty,
        busy: true,
        remaining: workerState.remaining,
        readyRemaining: workerState.ready,
        discoveryRemaining: discoveryState.remaining,
        discoveryReady: discoveryState.ready,
        nextDiscoveryAt: discoveryState.nextRunAt,
      };
    }
    this.isProcessing = true;

    try {
      const throughput = getImportThroughput();
      const now = Date.now();
      if (now - this.lastRecoveryAt >= 60_000) {
        await Promise.all([
          ImportRepository.recoverExpiredLeases(),
          ImportBatchService.recoverStuck(),
          ImportBatchService.recoverMisclassifiedTransactionTimeouts(),
        ]);
        this.lastRecoveryAt = now;
      }
      const shouldPollDiscovery = now - this.lastDiscoveryPollAt >= 5_000;
      if (shouldPollDiscovery) this.lastDiscoveryPollAt = now;
      const discoveryPromise = shouldPollDiscovery
        ? ImportBatchService.processNextPage().catch((error) => {
            logger.warn({ err: error }, '[ImportQueueWorker] Bulk discovery page deferred');
            return { processed: false };
          })
        : Promise.resolve({ processed: false });

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
      if (now - this.lastCleanupAt >= 60 * 60_000) {
        await ImportRepository.cleanupCompleted(90);
        this.lastCleanupAt = now;
      }
      if (now - this.lastFinalizationAt >= 30_000) {
        await ImportBatchService.finalizeImporting();
        this.lastFinalizationAt = now;
      }
      const workerState = await ImportRepository.getWorkerState();
      const discoveryState = await this.readDiscoveryState(
        Boolean(discovery.processed) || workerState.ready === 0,
      );

      return {
        claimed: jobs.length,
        completed: states.filter((job) => job?.status === 'COMPLETED').length,
        skipped: states.filter((job) => job?.status === 'SKIPPED').length,
        partial: states.filter((job) => job?.status === 'PARTIAL').length,
        failed: states.filter((job) => job?.status === 'FAILED').length,
        deferred: states.filter((job) => job?.status === 'PENDING').length,
        remaining: workerState.remaining,
        readyRemaining: workerState.ready,
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
