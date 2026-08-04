import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { requireAdmin } from '@/lib/auth';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const movieId = url.searchParams.get('movieId');

  if (!movieId) {
    return NextResponse.json({ error: 'movieId is required' }, { status: 400 });
  }

  const data = await AnalyticsService.getMovieAnalytics(movieId);
  if (!data) {
    return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
  }

  return NextResponse.json(data);
});
