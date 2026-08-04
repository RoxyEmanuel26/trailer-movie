import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { prisma } from '../prisma';
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
    return prisma.analyticsEvent.findMany({
      where: { eventName: 'system_error' },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  static async getErrorStats() {
    const errorCount = await prisma.dailyMetrics.aggregate({
      where: { metric: 'system_error' },
      _sum: { value: true },
    });
    return {
      totalErrors: errorCount._sum.value || 0,
    };
  }
}
