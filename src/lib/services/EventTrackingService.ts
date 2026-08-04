import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Prisma } from '@prisma/client';

export class EventTrackingService {
  static async trackPageView(path: string, userId?: string) {
    try {
      await AnalyticsRepository.logEvent({
        eventName: 'page_view',
        metadata: { path } as Prisma.JsonObject,
      });
      await AnalyticsRepository.incrementDailyMetric('page_view');
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  static async trackMovieView(movieId: string, userId?: string) {
    try {
      await AnalyticsRepository.logEvent({
        eventName: 'movie_view',
        entityType: 'Movie',
        entityId: movieId,
      });
      await AnalyticsRepository.incrementDailyMetric('movie_view', 'Movie', movieId);
    } catch (error) {
      console.error('Failed to track movie view:', error);
    }
  }

  static async trackTrailerPlay(movieId: string, trailerId: string, userId?: string) {
    try {
      await AnalyticsRepository.logEvent({
        eventName: 'trailer_play',
        entityType: 'Movie',
        entityId: movieId,
        metadata: { trailerId } as Prisma.JsonObject,
      });
      await AnalyticsRepository.incrementDailyMetric('trailer_play', 'Movie', movieId);
    } catch (error) {
      console.error('Failed to track trailer play:', error);
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
      await AnalyticsRepository.incrementDailyMetric('search');
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }
}
