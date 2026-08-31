import { BaseWorker } from '../worker';
import { NonRetryableJobError, RetryableJobError } from '../retry';
import { ImportSchema } from '../../api/schemas';
import { SyncService } from '../../services/import-service';

export interface MovieImportPayload {
  tmdbId: number;
}

export class MovieImportPipeline extends BaseWorker<MovieImportPayload> {
  protected async execute(data: MovieImportPayload): Promise<void> {
    this.tracker.update('VALIDATION', 10, 'Validating payload');
    const parsedData = ImportSchema.safeParse(data);

    if (!parsedData.success) {
      throw new NonRetryableJobError('Invalid payload data: ' + parsedData.error.message);
    }

    this.tracker.update('TMDB_DOWNLOAD', 30, 'Downloading data from TMDB');
    // In the real pipeline, SyncService.importMovie handles mapping and DB persistence.
    // By abstracting the stages here, we can monitor progress accurately.
    try {
      this.tracker.update('PERSIST', 60, 'Persisting to database via Domain Service');

      const result = await SyncService.importMovie(parsedData.data.tmdbId);

      this.tracker.update('MEDIA', 80, 'Queueing media background jobs');
      // enqueue TrailerDownloadJob(result.id)
      // enqueue ImageDownloadJob(result.id)

      this.tracker.update('SEO', 90, 'Generating SEO metadata');
      // Trigger SEO cache rebuilds
    } catch (error: any) {
      // If it's a known non-retryable error (e.g. 404 from TMDB), throw NonRetryable
      if (error.status === 404) {
        throw new NonRetryableJobError(`Movie ${data.tmdbId} not found on TMDB`);
      }
      // Otherwise assume retryable (e.g. 502 Bad Gateway)
      const errMessage = error?.message || String(error);
      throw new RetryableJobError(errMessage);
    }
  }
}
