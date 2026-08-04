import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export class AnalyticsRepository {
  static async getOverviewMetrics(db: any = prisma) {
    const [moviesCount, publishedCount, collectionsCount, genresCount] = await Promise.all([
      db.movie.count(),
      db.movie.count({ where: { status: 'PUBLISHED' } }),
      db.collection.count(),
      db.genre.count(),
    ]);

    const pageViews = await db.dailyMetrics.aggregate({
      where: { metric: 'page_view' },
      _sum: { value: true },
    });

    const trailerPlays = await db.dailyMetrics.aggregate({
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

  static async getDailyMetricsByDateRange(metric: string, startDate: Date, endDate: Date, db: any = prisma) {
    return db.dailyMetrics.findMany({
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

  static async incrementDailyMetric(metric: string, entityType?: string, entityId?: string, db: any = prisma) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return db.dailyMetrics.upsert({
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

  static async logEvent(data: Prisma.AnalyticsEventCreateInput, db: any = prisma) {
    return db.analyticsEvent.create({ data });
  }

  static async getTopMoviesByMetric(metric: string, take: number = 10, db: any = prisma) {
    const topMetrics = await db.dailyMetrics.groupBy({
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

    const movieIds = topMetrics.map((m: any) => m.entityId).filter(Boolean) as string[];
    const movies = await db.movie.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, title: true, slug: true, posterUrl: true },
    });

    return topMetrics.map((metric: any) => {
      const movie = movies.find((m: any) => m.id === metric.entityId);
      return {
        ...movie,
        count: metric._sum.value || 0,
      };
    });
  }

  static async getTopSearchQueries(limit: number = 20, db: any = prisma) {
    const results = await db.$queryRaw`
      SELECT LOWER(metadata->>'query') as query, COUNT(*)::int as count
      FROM "AnalyticsEvent"
      WHERE "eventName" = 'search' 
        AND metadata->>'query' IS NOT NULL
      GROUP BY LOWER(metadata->>'query')
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return results;
  }

  static async getZeroResultSearchQueries(limit: number = 20, db: any = prisma) {
    const results = await db.$queryRaw`
      SELECT LOWER(metadata->>'query') as query, COUNT(*)::int as count
      FROM "AnalyticsEvent"
      WHERE "eventName" = 'search' 
        AND metadata->>'query' IS NOT NULL
        AND (metadata->>'resultsCount')::int = 0
      GROUP BY LOWER(metadata->>'query')
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return results;
  }

  static async getRecentAdminActivity(take: number = 10, db: any = prisma) {
    return db.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  static async getMovieAnalytics(movieId: string, db: any = prisma) {
    const movie = await db.movie.findUnique({
      where: { id: movieId },
      select: { title: true, id: true }
    });

    if (!movie) return null;

    const views = await db.dailyMetrics.aggregate({
      where: { metric: 'movie_view', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    const trailerPlays = await db.dailyMetrics.aggregate({
      where: { metric: 'trailer_play', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    return {
      movie,
      views: views._sum.value || 0,
      trailerPlays: trailerPlays._sum.value || 0,
    };
  }
}
