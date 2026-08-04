import * as React from 'react';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsChart } from '@/components/admin/analytics/AnalyticsChart';
import { Film, Play, Eye, Users } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnalyticsOverviewPage() {
  const data = await AnalyticsService.getOverviewDashboard();
  const { metrics, chartData, topMovies, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pageViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trailer Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trailerPlays.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movies (Published)</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.publishedMovies.toLocaleString()} / {metrics.movies.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genres / Collections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.genres.toLocaleString()} / {metrics.collections.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Page Views (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMovies.map((movie: any) => (
                <div key={movie.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Placeholder for movie poster if needed */}
                    <div className="h-10 w-10 bg-muted rounded-md bg-cover bg-center" style={{ backgroundImage: movie.posterUrl ? `url(${movie.posterUrl})` : undefined }} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{movie.title}</p>
                      <p className="text-sm text-muted-foreground">{movie.count} views</p>
                    </div>
                  </div>
                  <Link href={`/admin/analytics/movies?movieId=${movie.id}`} className="text-sm text-blue-500 hover:underline">
                    View
                  </Link>
                </div>
              ))}
              {topMovies.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {activity.user?.name || 'System'} performed <span className="font-bold">{activity.actionType}</span> on {activity.entityType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleString()} • Entity ID: {activity.entityId}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
