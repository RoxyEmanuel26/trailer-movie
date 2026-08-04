import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Prisma } from '@prisma/client';

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
    return AnalyticsRepository.getRecentErrors(take);
  }

  static async getErrorStats() {
    return AnalyticsRepository.getErrorStats();
  }
}
