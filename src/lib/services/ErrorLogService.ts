import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '../auth/utils';

export class ErrorLogService {
  static async logError(context: string, error: any) {
    try {
      await AnalyticsRepository.logEvent({
        eventName: 'system_error',
        metadata: {
          context,
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        } as Prisma.JsonObject,
      });
      await AnalyticsRepository.incrementDailyMetric('system_error');
    } catch (e) {
      console.error('Failed to log error to DB:', e);
    }
  }

  static async getRecentErrors(take: number = 50) {
    await requireAdmin('read:analytics');
    return AnalyticsRepository.getRecentErrors(take);
  }

  static async getErrorStats() {
    await requireAdmin('read:analytics');
    return AnalyticsRepository.getErrorStats();
  }
}
