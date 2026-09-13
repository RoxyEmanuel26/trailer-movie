import { BaseWorker } from '../worker';
import { NonRetryableJobError, PartialJobError } from '../retry';
import { ImportSchema } from '../../api/schemas';
import { SyncService } from '../../services/import-service';

export interface MovieImportPayload {
  tmdbId: number;
}

export class MovieImportPipeline extends BaseWorker<MovieImportPayload> {
  protected async execute(data: MovieImportPayload): Promise<unknown> {
    await this.tracker.update('VALIDATION', 10, 'Validating payload');
    const parsedData = ImportSchema.safeParse(data);

    if (!parsedData.success) {
      throw new NonRetryableJobError('Invalid payload data: ' + parsedData.error.message);
    }

    await this.tracker.update('TMDB_DOWNLOAD', 30, 'Downloading data from TMDB');
    // In the real pipeline, SyncService.importMovie handles mapping and DB persistence.
    // By abstracting the stages here, we can monitor progress accurately.
    await this.tracker.update('PERSIST', 60, 'Persisting to database via Domain Service');

    const result = await SyncService.importMovie(parsedData.data.tmdbId);
    await this.tracker.update('QUALITY_GATE', 90, 'Evaluating publication quality');
    if (result.partialIssues.length > 0) {
      throw new PartialJobError(result.partialIssues.join(', '));
    }
    return result;
  }
}
