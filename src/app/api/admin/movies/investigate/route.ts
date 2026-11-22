import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api/handler';
import { ValidationError } from '@/lib/errors';
import { SyncService } from '@/lib/services/import-service';
import { requireAdmin } from '@/lib/auth/utils';
import { clearAllPublicMemoryCaches } from '@/lib/memory-cache';
import { HOMEPAGE_CATALOG_TAG } from '@/lib/homepage-cache';

export const maxDuration = 300;
const MAX_SCAN_RESULTS = 200;

export const GET = apiHandler(async () => {
  await requireAdmin('read:movies');

  const missingDataMovies = await prisma.movie.findMany({
    where: {
      deletedAt: null,
      tmdbId: { not: null },
      OR: [
        { posterUrl: null },
        { synopsis: null },
        { releaseDate: null },
        { keywords: { none: {} } },
        { companies: { none: {} } },
        { countries: { none: {} } },
        { languages: { none: {} } },
        { people: { none: {} } },
        { synopsis: { contains: 'coming soon', mode: 'insensitive' } },
        { posterUrl: { contains: 'coming soon', mode: 'insensitive' } },
        { youtubeTrailerId: { contains: 'coming soon', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      tmdbId: true,
      title: true,
      posterUrl: true,
      synopsis: true,
      releaseDate: true,
      ageRating: true,
      youtubeTrailerId: true,
      _count: {
        select: {
          keywords: true,
          companies: true,
          countries: true,
          languages: true,
          people: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_SCAN_RESULTS,
  });

  const annotated = missingDataMovies.map((m) => ({
    ...m,
    missingFields: [
      !m.posterUrl && 'posterUrl',
      !m.synopsis && 'synopsis',
      !m.releaseDate && 'releaseDate',
      m._count.keywords === 0 && 'keywords',
      m._count.companies === 0 && 'companies',
      m._count.countries === 0 && 'countries',
      m._count.languages === 0 && 'languages',
      m._count.people === 0 && 'people',
      m.synopsis?.toLowerCase().includes('coming soon') && 'synopsis (coming soon)',
      m.posterUrl?.toLowerCase().includes('coming soon') && 'posterUrl (coming soon)',
      m.youtubeTrailerId?.toLowerCase().includes('coming soon') && 'youtubeTrailerId (coming soon)',
    ].filter(Boolean),
  }));

  return NextResponse.json({ data: annotated, total: annotated.length, truncated: annotated.length === MAX_SCAN_RESULTS });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin('write:imports');

  const body = await req.json();
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid JSON payload');
  }
  const { tmdbIds } = body as { tmdbIds?: unknown };

  if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
    throw new ValidationError('Invalid payload: tmdbIds must be a non-empty array');
  }

  const MAX_BATCH = 100;
  if (tmdbIds.length > MAX_BATCH) {
    throw new ValidationError(`Too many IDs. Maximum is ${MAX_BATCH} per request.`);
  }

  const invalidIds = tmdbIds.filter((id: unknown) => !Number.isInteger(id) || (id as number) <= 0);
  if (invalidIds.length > 0) {
    throw new ValidationError(
      `Invalid tmdbIds: ${invalidIds.slice(0, 5).join(', ')}. All IDs must be positive integers.`,
    );
  }

  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    details: [] as { tmdbId: number; status: string; message: string }[],
  };

  for (const tmdbId of tmdbIds as number[]) {
    try {
      const patchResult = await SyncService.patchMissingData(tmdbId);
      if (patchResult.updated) {
        results.success++;
        results.details.push({ tmdbId, status: 'UPDATED', message: 'Patched missing fields successfully' });
      } else {
        results.skipped++;
        results.details.push({ tmdbId, status: 'SKIPPED', message: 'No new missing fields available on TMDB' });
      }
    } catch (error: any) {
      results.failed++;
      results.details.push({ tmdbId, status: 'FAILED', message: error?.message || 'Patch failed' });
    }
  }

  if (results.success > 0) {
    clearAllPublicMemoryCaches();
    try {
      revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
      revalidatePath('/', 'page');
      revalidatePath('/movies', 'page');
      revalidatePath('/sitemap.xml', 'page');
    } catch {
      // Ignore revalidation errors outside Next.js server store
    }
  }

  return NextResponse.json({ data: results });
});

