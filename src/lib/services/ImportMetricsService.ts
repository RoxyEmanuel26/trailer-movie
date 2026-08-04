import { ImportRepository } from '../repositories/ImportRepository';

export class ImportMetricsService {
  static async getImportOverview() {
    return ImportRepository.getOverview();
  }
}
