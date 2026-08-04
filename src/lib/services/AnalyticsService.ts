import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { prisma } from '../prisma';

export class AnalyticsService {
  static async getOverviewDashboard() {
    const metrics = await AnalyticsRepository.getOverviewMetrics();
    
    // Get last 7 days of page views for a chart
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const dailyViews = await AnalyticsRepository.getDailyMetricsByDateRange('page_view', startDate, endDate);
    const topMovies = await AnalyticsRepository.getTopMoviesByMetric('movie_view', 5);

    // Get recent admin actions
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    return {
      metrics,
      chartData: dailyViews.map(d => ({ date: d.date.toISOString().split('T')[0], views: d.value })),
      topMovies,
      recentActivity,
    };
  }

  static async getMovieAnalytics(movieId: string) {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { title: true, id: true }
    });

    if (!movie) return null;

    const views = await prisma.dailyMetrics.aggregate({
      where: { metric: 'movie_view', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    const trailerPlays = await prisma.dailyMetrics.aggregate({
      where: { metric: 'trailer_play', entityType: 'Movie', entityId: movieId },
      _sum: { value: true },
    });

    return {
      movie,
      views: views._sum.value || 0,
      trailerPlays: trailerPlays._sum.value || 0,
    };
  }

  static async getSearchAnalytics() {
    // A bit more complex: group search terms from AnalyticsEvent metadata
    const searchEvents = await prisma.analyticsEvent.findMany({
      where: { eventName: 'search' },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Process last 1000 searches
    });

    const queryCounts: Record<string, number> = {};
    const zeroResultQueries: string[] = [];

    searchEvents.forEach(event => {
      const meta = event.metadata as any;
      if (meta && meta.query) {
        const query = meta.query.toLowerCase();
        queryCounts[query] = (queryCounts[query] || 0) + 1;
        if (meta.resultsCount === 0) {
          zeroResultQueries.push(query);
        }
      }
    });

    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    return {
      topQueries,
      zeroResultQueries: Array.from(new Set(zeroResultQueries)).slice(0, 20),
      totalSearchesAnalyzed: searchEvents.length,
    };
  }
}
