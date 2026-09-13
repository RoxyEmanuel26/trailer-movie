import { BaseWorker } from '../worker';
import { NonRetryableJobError } from '../retry';
import { PersonImportService } from '../../services/PersonImportService';

export interface PersonImportPayload { tmdbId: number }

export class PersonImportPipeline extends BaseWorker<PersonImportPayload> {
  protected async execute(data: PersonImportPayload): Promise<unknown> {
    if (!Number.isSafeInteger(data.tmdbId) || data.tmdbId <= 0) {
      throw new NonRetryableJobError('Invalid person TMDB ID');
    }
    await this.tracker.update('TMDB_DOWNLOAD', 30, 'Downloading person details and combined credits');
    const result = await PersonImportService.enrich(data.tmdbId);
    await this.tracker.update('PERSIST', 90, 'Person profile saved');
    return result;
  }
}
