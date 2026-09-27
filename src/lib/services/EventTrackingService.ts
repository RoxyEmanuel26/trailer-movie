import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Prisma } from '@prisma/client';
import { createAnalyticsDedupeKey } from '../analytics/server';

export class EventTrackingService {
  static async trackPageView(path: string, userId?: string) {
    try {
      await AnalyticsRepository.recordEventAndMetric({
        eventName: 'page_view',
        metadata: { path } as Prisma.JsonObject,
        metric: 'page_view',
      });

    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  static async trackMovieView(movieId: string, anonymousId: string) {
    try {
      if (!(await AnalyticsRepository.isPublicAnalyticsMovie(movieId))) return false;
      return await AnalyticsRepository.recordEventAndMetric({
        eventName: 'qualified_movie_view',
        metric: 'qualified_movie_view',
        entityType: 'Movie',
        entityId: movieId,
        dedupeKey: createAnalyticsDedupeKey({
          anonymousId,
          eventName: 'qualified_movie_view',
          entityId: movieId,
        }),
      });
    } catch (error) {
      console.error('Failed to track movie view:', error);
      return false;
    }
  }

  static async trackTrailerPlay(movieId: string, trailerId: string, anonymousId: string) {
    try {
      if (!(await AnalyticsRepository.isPublicAnalyticsMovie(movieId))) return false;
      return await AnalyticsRepository.recordEventAndMetric({
        eventName: 'qualified_trailer_play',
        metric: 'qualified_trailer_play',
        entityType: 'Movie',
        entityId: movieId,
        metadata: { trailerId } as Prisma.JsonObject,
        dedupeKey: createAnalyticsDedupeKey({
          anonymousId,
          eventName: 'qualified_trailer_play',
          entityId: movieId,
        }),
      });
    } catch (error) {
      console.error('Failed to track trailer play:', error);
      return false;
    }
  }

  static async trackSearch(query: string, resultsCount: number, userId?: string) {
    try {
      // Use raw prisma for SearchLog if needed, or AnalyticsEvent
      // Using AnalyticsEvent for unified tracking
      await AnalyticsRepository.logEvent({
        eventName: 'search',
        metadata: { query, resultsCount } as Prisma.JsonObject,
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  static async trackGeneric(eventName: string, entityId?: string, metadata?: Prisma.JsonObject) {
    await AnalyticsRepository.logEvent({ eventName, entityId, metadata });
  }
}
