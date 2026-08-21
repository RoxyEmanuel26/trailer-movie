import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tmdbFetch } from '@/lib/tmdb/client';
import { requireAdmin } from '@/lib/auth/utils';

export async function POST(req: Request) {
  try {
    await requireAdmin('write:imports');
    
    const body = await req.json();
    const { page = 1, startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    // Fetch page from TMDB
    let response;
    try {
      response = await tmdbFetch<any>('/discover/movie', {
        params: {
          'primary_release_date.gte': startDate,
          'primary_release_date.lte': endDate,
          'sort_by': 'primary_release_date.desc',
          page: page,
          language: 'en-US',
        },
      });
    } catch (tmdbError: any) {
      if (tmdbError.name === 'TmdbRateLimitError' || tmdbError.message?.includes('Rate limit') || tmdbError.status === 429) {
        return NextResponse.json({ rateLimited: true }, { status: 429 });
      }
      throw tmdbError;
    }

    const totalPages = Math.min(response.total_pages, 500); // TMDB hard limit
    const movies = response.results || [];

    let queued = 0;
    let skipped = 0;

    // OPTIMIZATION: Batch query existing movies and jobs to reduce DB roundtrips from 40 to 2
    const tmdbIds = movies.map((m: any) => m.id).filter(Boolean);
    
    const [existingMovies, existingJobs] = await Promise.all([
      prisma.movie.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true },
      }),
      prisma.importJob.findMany({
        where: { tmdbId: { in: tmdbIds }, entityType: 'Movie' },
        select: { tmdbId: true },
      })
    ]);

    const skipSet = new Set([
      ...existingMovies.map(m => m.tmdbId),
      ...existingJobs.map(j => j.tmdbId)
    ]);

    // Batch insert jobs
    const jobsToCreate = movies
      .filter((movie: any) => movie.id && !skipSet.has(movie.id))
      .map((movie: any) => ({
        tmdbId: movie.id,
        entityType: 'Movie',
        status: 'PENDING',
      }));

    skipped = movies.length - jobsToCreate.length;
    queued = jobsToCreate.length;

    if (jobsToCreate.length > 0) {
      await prisma.importJob.createMany({
        data: jobsToCreate,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      queued,
      skipped,
      totalPages,
      currentPage: page,
    });
  } catch (error: any) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
