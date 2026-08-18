import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { requireAdmin } from '../auth/utils';

export class AnalyticsService {
  static async getOverviewDashboard() {
    await requireAdmin('read:analytics');
    const metrics = await AnalyticsRepository.getOverviewMetrics();
    
    // Get last 7 days of page views for a chart
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const dailyViews = await AnalyticsRepository.getDailyMetricsByDateRange('page_view', startDate, endDate);
    const topMovies = await AnalyticsRepository.getTopMoviesByMetric('movie_view', 5);

    // Get recent admin actions
    const recentActivity = await AnalyticsRepository.getRecentAdminActivity(10);

    return {
      metrics,
      chartData: dailyViews.map((d: any) => ({ date: d.date.toISOString().split('T')[0], views: d.value })),
      topMovies,
      recentActivity,
    };
  }

  static async getMovieAnalytics(movieId: string) {
    await requireAdmin('read:analytics');
    return AnalyticsRepository.getMovieAnalytics(movieId);
  }

  static async getSearchAnalytics() {
    await requireAdmin('read:analytics');
    // Uses native PostgreSQL GROUP BY instead of loading 1000 rows into Node.js memory
    const topQueries = await AnalyticsRepository.getTopSearchQueries(20);
    const zeroResultRaw = await AnalyticsRepository.getZeroResultSearchQueries(20);

    return {
      topQueries,
      zeroResultQueries: zeroResultRaw.map((r: any) => r.query),
      totalSearchesAnalyzed: 'All-time (Database Aggregation)', // We don't limit to 1000 anymore
    };
  }

  static async listAdminActivity(skip: number, take: number) {
    await requireAdmin('read:analytics');
    const safeTake = Math.min(Number(take) || 50, 100);
    return AnalyticsRepository.listAdminActivity(skip, safeTake);
  }
}
