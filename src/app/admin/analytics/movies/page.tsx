import * as React from 'react';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function MovieAnalyticsPage({
  searchParams,
}: {
  searchParams: { movieId?: string };
}) {
  const movieId = searchParams.movieId;

  // If no movie is selected, show a list of movies to select from
  if (!movieId) {
    const movies = await prisma.movie.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true },
    });

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Movie to View Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/admin/analytics/movies?movieId=${movie.id}`}
                  className="p-4 border rounded-md hover:bg-muted transition-colors flex justify-between items-center"
                >
                  <span className="font-medium truncate">{movie.title}</span>
                  <span className="text-xs text-muted-foreground">{movie.slug}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = await AnalyticsService.getMovieAnalytics(movieId);

  if (!data) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold">Movie not found</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/analytics/movies">Back to Movies</Link>
        </Button>
      </div>
    );
  }

  const { movie, views, trailerPlays } = data;

  const playRate = views > 0 ? Math.round((trailerPlays / views) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{movie.title} Analytics</h2>
          <p className="text-muted-foreground">ID: {movie.id}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/analytics/movies">Change Movie</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{views.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trailer Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trailerPlays.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Play Rate (Plays / Views)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playRate}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
