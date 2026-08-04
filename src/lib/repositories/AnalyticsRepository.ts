import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export class AnalyticsRepository {
  static async getOverviewMetrics() {
    const [moviesCount, publishedCount, collectionsCount, genresCount] = await Promise.all([
      prisma.movie.count(),
      prisma.movie.count({ where: { status: 'PUBLISHED' } }),
      prisma.collection.count(),
      prisma.genre.count(),
    ]);

    const pageViews = await prisma.dailyMetrics.aggregate({
      where: { metric: 'page_view' },
      _sum: { value: true },
    });

    const trailerPlays = await prisma.dailyMetrics.aggregate({
      where: { metric: 'trailer_play' },
      _sum: { value: true },
    });

    return {
      movies: moviesCount,
      publishedMovies: publishedCount,
      collections: collectionsCount,
      genres: genresCount,
      pageViews: pageViews._sum.value || 0,
      trailerPlays: trailerPlays._sum.value || 0,
    };
  }

  static async getDailyMetricsByDateRange(metric: string, startDate: Date, endDate: Date) {
    return prisma.dailyMetrics.findMany({
      where: {
        metric,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  static async incrementDailyMetric(metric: string, entityType?: string, entityId?: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return prisma.dailyMetrics.upsert({
      where: {
        date_metric_entityType_entityId: {
          date: today,
          metric,
          entityType: entityType || '',
          entityId: entityId || '',
        },
      },
      update: {
        value: { increment: 1 },
      },
      create: {
        date: today,
        metric,
        entityType: entityType || '',
        entityId: entityId || '',
        value: 1,
      },
    });
  }

  static async logEvent(data: Prisma.AnalyticsEventCreateInput) {
    return prisma.analyticsEvent.create({ data });
  }

  static async getTopMoviesByMetric(metric: string, take: number = 10) {
    const topMetrics = await prisma.dailyMetrics.groupBy({
      by: ['entityId'],
      where: {
        metric,
        entityType: 'Movie',
      },
      _sum: {
        value: true,
      },
      orderBy: {
        _sum: {
          value: 'desc',
        },
      },
      take,
    });

    const movieIds = topMetrics.map(m => m.entityId).filter(Boolean) as string[];
    const movies = await prisma.movie.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, title: true, slug: true, posterUrl: true },
    });

    return topMetrics.map(metric => {
      const movie = movies.find(m => m.id === metric.entityId);
      return {
        ...movie,
        count: metric._sum.value || 0,
      };
    });
  }
}
