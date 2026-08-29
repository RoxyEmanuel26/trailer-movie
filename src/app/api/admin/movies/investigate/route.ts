import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { SyncService } from '@/lib/services/import-service';
import { requireAdmin } from '@/lib/auth/utils';

export async function GET() {
  try {
    await requireAdmin('read:movies');

    const missingDataMovies = await prisma.movie.findMany({
      where: {
        deletedAt: null,
        OR: [
          // Basic fields
          { posterUrl: null },
          { synopsis: null },
          { releaseDate: null },
          // Financial fields (added after migration)
          { budget: null },
          { revenue: null },
          // Certification
          { ageRating: null },
          // JSON fields (null means never populated)
          { watchProviders: { equals: Prisma.DbNull } },
          { reviews: { equals: Prisma.DbNull } },
          // Relational fields — no linked records at all
          { keywords: { none: {} } },
          { companies: { none: {} } },
        ]
      },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        posterUrl: true,
        synopsis: true,
        releaseDate: true,
        budget: true,
        revenue: true,
        ageRating: true,
        watchProviders: true,
        reviews: true,
        _count: {
          select: {
            keywords: true,
            companies: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Label each movie with what is actually missing for clarity in the admin UI
    const annotated = missingDataMovies.map((m) => ({
      ...m,
      budget: m.budget ? Number(m.budget) : null,
      revenue: m.revenue ? Number(m.revenue) : null,
      missingFields: [
        !m.posterUrl && 'posterUrl',
        !m.synopsis && 'synopsis',
        !m.releaseDate && 'releaseDate',
        m.budget === null && 'budget',
        m.revenue === null && 'revenue',
        !m.ageRating && 'ageRating',
        m.watchProviders === null && 'watchProviders',
        m.reviews === null && 'reviews',
        m._count.keywords === 0 && 'keywords',
        m._count.companies === 0 && 'companies',
      ].filter(Boolean),
    }));

    return NextResponse.json({ data: annotated, total: annotated.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin('write:imports');

    const body = await req.json();
    const { tmdbIds } = body;

    if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: tmdbIds must be a non-empty array' }, { status: 400 });
    }

    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as { tmdbId: number; status: string; message: string }[],
    };

    for (const tmdbId of tmdbIds) {
      try {
        // Directly call the smart patch — 1 API call per movie.
        // It reads from local DB to find what's missing, fetches getMovieExtra,
        // and updates ONLY the missing fields (skipping 20+ heavy cast/trailer API calls).
        await SyncService.patchMissingData(tmdbId);
        results.success++;
        results.details.push({ tmdbId, status: 'UPDATED', message: 'Patched missing fields successfully' });
      } catch (error: any) {
        results.failed++;
        results.details.push({ tmdbId, status: 'FAILED', message: error.message });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

