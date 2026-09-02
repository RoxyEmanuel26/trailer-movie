import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tmdbFetch } from '@/lib/tmdb/client';
import { requireAdmin } from '@/lib/auth/utils';
import { logger } from '@/lib/logger';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  try {
    await requireAdmin('write:imports');
    
    const body = await req.json();
    const { page: rawPage = 1, startDate, endDate, country } = body;
    const page = parseInt(String(rawPage), 10);

    if (!Number.isInteger(page) || page < 1 || page > 500) {
      return NextResponse.json({ error: 'Invalid page. Must be a number between 1 and 500.' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    if (!ISO_DATE_REGEX.test(startDate) || !ISO_DATE_REGEX.test(endDate)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: 'startDate must be before or equal to endDate.' }, { status: 400 });
    }

    // Prepare params
    const params: Record<string, any> = {
      'primary_release_date.gte': startDate,
      'primary_release_date.lte': endDate,
      'sort_by': 'primary_release_date.desc',
      page: page,
      language: 'en-US',
    };

    if (country) {
      // Validasi keamanan: Pastikan hanya berisi 2 huruf kapital (ISO 3166-1 alpha-2)
      if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) {
        return NextResponse.json({ error: 'Invalid country format. Must be a 2-letter ISO code.' }, { status: 400 });
      }
      params['with_origin_country'] = country;
    }

    // Fetch page from TMDB
    let response;
    try {
      response = await tmdbFetch<any>('/discover/movie', {
        params,
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
    logger.error({ err: error }, '[BulkImport] Bulk Import Error');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
