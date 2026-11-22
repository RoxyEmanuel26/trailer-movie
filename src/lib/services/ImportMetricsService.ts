import { ImportRepository } from '../repositories/ImportRepository';
import { requireAdmin } from '../auth/utils';

export class ImportMetricsService {
  static async getImportOverview() {
    await requireAdmin('read:imports');
    return ImportRepository.getOverview();
  }
}
