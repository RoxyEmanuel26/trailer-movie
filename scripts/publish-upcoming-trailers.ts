import { MovieStatus, TrailerSource, TrailerStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import {
  evaluateMovieQuality,
  ImportQualityService,
  UPCOMING_WINDOW_DAYS,
} from '../src/lib/services/ImportQualityService';
import { moviePath } from '../src/lib/public-routes';
import { absoluteUrl } from '../src/lib/site-config';
import { submitIndexNowUrls } from '../src/lib/indexnow';

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;
  const now = new Date();
  const maxUpcomingDate = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 86_400_000);

  const candidates = await prisma.movie.findMany({
    where: {
      deletedAt: null,
      status: MovieStatus.DRAFT,
      releaseDate: {
        gt: now,
        lte: maxUpcomingDate,
      },
      productionStatus: {
        in: ['Post Production', 'In Production', 'Planned'],
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      releaseDate: true,
      synopsis: true,
      posterUrl: true,
      productionStatus: true,
      youtubeTrailerId: true,
      popularity: true,
      lockedFields: true,
      _count: { select: { genres: true } },
      trailers: {
        where: { status: TrailerStatus.ACTIVE, sourceType: TrailerSource.YOUTUBE },
        select: { sourceId: true },
        take: 1,
      },
    },
    orderBy: [{ popularity: 'desc' }, { releaseDate: 'asc' }],
  });

  const qualifying = candidates.filter((movie) => {
    const locked = Array.isArray(movie.lockedFields) ? movie.lockedFields : [];
    if (locked.includes('status')) return false;
    const issues = evaluateMovieQuality(
      {
        title: movie.title,
        releaseDate: movie.releaseDate,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        productionStatus: movie.productionStatus,
        youtubeTrailerId: movie.youtubeTrailerId,
        genreCount: movie._count.genres,
        activeYoutubeTrailerCount: movie.trailers.length,
      },
      now,
    );
    return issues.length === 0;
  });

  console.log(
    `[Upcoming Trailers] Mode: ${dryRun ? 'DRY RUN' : 'APPLY'} | Upcoming drafts scanned: ${candidates.length} | Trailer-ready qualifying: ${qualifying.length}`,
  );

  if (qualifying.length > 0) {
    console.log('Top qualifying upcoming releases:');
    for (const movie of qualifying.slice(0, 20)) {
      const dateStr = movie.releaseDate ? movie.releaseDate.toISOString().slice(0, 10) : 'TBA';
      const ytId = movie.trailers[0]?.sourceId || movie.youtubeTrailerId || 'unknown';
      console.log(
        `  - ${movie.title} (${dateStr}, pop=${(movie.popularity ?? 0).toFixed(1)}, yt=${ytId}) -> ${moviePath(movie.slug)}`,
      );
    }
  }

  if (dryRun) {
    console.log('[Upcoming Trailers] Pass --apply to publish qualifying upcoming trailer pages.');
    return;
  }

  let promoted = 0;
  const promotedUrls: string[] = [absoluteUrl('/upcoming')];

  for (const movie of qualifying) {
    const result = await ImportQualityService.evaluate(movie.id, prisma);
    if (result.ready) {
      promoted += 1;
      if (promotedUrls.length < 500) {
        promotedUrls.push(absoluteUrl(moviePath(movie.slug)));
      }
    }
  }

  const indexNow = await submitIndexNowUrls(promotedUrls);
  console.log(
    `[Upcoming Trailers] Promoted ${promoted} upcoming trailer-ready movie(s) to PUBLISHED. IndexNow submitted=${indexNow.submitted} ok=${indexNow.ok}`,
  );
}

main()
  .catch((error) => {
    console.error('[Upcoming Trailers] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
