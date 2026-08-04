import { TransactionManager } from '../repositories/TransactionManager';

export class HealthService {
  static async checkDatabase() {
    return TransactionManager.run(async (tx) => tx.$queryRaw`SELECT 1`);
  }
}
