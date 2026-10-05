import { randomUUID } from 'node:crypto';
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
      where: { metric: 'qualified_trailer_play' },
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

  static async recordEventAndMetric(input: {
    eventName: string;
    metric?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Prisma.JsonObject;
    dedupeKey?: string;
  }, db: any = prisma) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // A single PostgreSQL statement avoids holding an interactive Prisma
    // transaction while the local import worker is using the same database.
    // The metric CTE only runs when the event insert succeeds, so deduplicated
    // movie/trailer views cannot increment the daily total twice.
    const eventInsert = Prisma.sql`
      INSERT INTO "analytics_events" ("id", "eventName", "entityType", "entityId", "metadata", "dedupeKey")
      VALUES (
        ${randomUUID()}, ${input.eventName}, ${input.entityType ?? null}, ${input.entityId ?? null},
        CAST(${JSON.stringify(input.metadata ?? null)} AS jsonb), ${input.dedupeKey ?? null}
      )
      ON CONFLICT ("dedupeKey") DO NOTHING
      RETURNING 1
    `;

    if (!input.metric) {
      const inserted = await db.$queryRaw(eventInsert) as unknown[];
      return inserted.length > 0;
    }

    const rows = await db.$queryRaw(Prisma.sql`
      WITH inserted AS (${eventInsert}), counted AS (
        INSERT INTO "daily_metrics" ("id", "date", "metric", "entityType", "entityId", "value")
        SELECT ${randomUUID()}, CAST(${today} AS date), ${input.metric},
          ${input.entityType ?? ''}, ${input.entityId ?? ''}, 1
        FROM inserted
        ON CONFLICT ("date", "metric", "entityType", "entityId")
        DO UPDATE SET "value" = "daily_metrics"."value" + 1
        RETURNING 1
      )
      SELECT EXISTS(SELECT 1 FROM inserted) AS recorded,
        EXISTS(SELECT 1 FROM counted) AS metric_recorded
    `) as Array<{ recorded: boolean; metric_recorded: boolean }>;
    return rows[0]?.recorded === true && rows[0]?.metric_recorded === true;
  }

  static async isPublicAnalyticsMovie(movieId: string, db: any = prisma) {
    const movie = await db.movie.findFirst({
      where: {
        id: movieId,
        status: 'PUBLISHED',
        deletedAt: null,
        importQualityStatus: 'READY',
      },
      select: { id: true },
    });
    return Boolean(movie);
  }

  static async getHomepageEngagementSignals(since: Date, db: any = prisma) {
    const rows = await db.dailyMetrics.groupBy({
      by: ['metric', 'entityId'],
      where: {
        date: { gte: since },
        metric: { in: ['qualified_movie_view', 'qualified_trailer_play'] },
        entityType: 'Movie',
        entityId: { not: null },
      },
      _sum: { value: true },
    });

    const signals = new Map<string, { views: number; trailerPlays: number }>();
    for (const row of rows as Array<{ metric: string; entityId: string | null; _sum: { value: number | null } }>) {
      if (!row.entityId) continue;
      const current = signals.get(row.entityId) || { views: 0, trailerPlays: 0 };
      if (row.metric === 'qualified_movie_view') current.views = row._sum.value || 0;
      if (row.metric === 'qualified_trailer_play') current.trailerPlays = row._sum.value || 0;
      signals.set(row.entityId, current);
    }
    return signals;
  }

  static async deleteExpiredRawEvents(retentionDays = 90, db: any = prisma) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    return db.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
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
      FROM "analytics_events"
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
      FROM "analytics_events"
      WHERE "eventName" = 'search' 
        AND metadata->>'query' IS NOT NULL
        AND (metadata->>'resultsCount')::int = 0
      GROUP BY LOWER(metadata->>'query')
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return results;
  }

  static async getSeoObservability(db: any = prisma) {
    const [vitals, published, ready, topPages] = await Promise.all([
      db.$queryRaw<Array<{ name: string; p75: number; samples: number }>>`
        SELECT metadata->>'name' AS name,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY (metadata->>'value')::double precision) AS p75,
          COUNT(*)::int AS samples
        FROM "analytics_events"
        WHERE "eventName" = 'web_vital'
          AND metadata->>'name' IN ('LCP', 'INP', 'CLS')
          AND "createdAt" >= NOW() - INTERVAL '28 days'
        GROUP BY metadata->>'name'
      `,
      db.movie.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      db.movie.count({ where: { status: 'PUBLISHED', deletedAt: null, importQualityStatus: 'READY' } }),
      db.$queryRaw<Array<{ path: string; views: number }>>`
        SELECT metadata->>'path' AS path, COUNT(*)::int AS views
        FROM "analytics_events"
        WHERE "eventName" = 'page_view' AND metadata->>'path' IS NOT NULL
        GROUP BY metadata->>'path'
        ORDER BY views DESC
        LIMIT 8
      `,
    ]);
    return {
      vitals,
      qualityReadyPercent: published ? Math.round((ready / published) * 1000) / 10 : 100,
      topPages,
    };
  }

  static async getRecentAdminActivity(take: number = 10, db: any = prisma) {
    return db.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  static async listAdminActivity(skip: number, take: number, db: any = prisma) {
    const [total, data] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
    return { total, data };
  }

  static async getRecentErrors(take: number = 50, db: any = prisma) {
    return db.analyticsEvent.findMany({
      where: { eventName: 'system_error' },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  static async getErrorStats(db: any = prisma) {
    const errorCount = await db.dailyMetrics.aggregate({
      where: { metric: 'system_error' },
      _sum: { value: true },
    });
    return {
      totalErrors: errorCount._sum.value || 0,
    };
  }

  static async getMovieAnalytics(movieId: string, db: any = prisma) {
    const movie = await db.movie.findUnique({
      where: { id: movieId },
      select: { title: true, id: true }
    });

    if (!movie) return null;

    const views = await db.dailyMetrics.aggregate({
      where: { metric: 'qualified_movie_view', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    const trailerPlays = await db.dailyMetrics.aggregate({
      where: { metric: 'qualified_trailer_play', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    return {
      movie,
      views: views._sum.value || 0,
      trailerPlays: trailerPlays._sum.value || 0,
    };
  }
}
