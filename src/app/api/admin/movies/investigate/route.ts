import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMovie } from '@/lib/tmdb/api';
import { SyncService } from '@/lib/services/import-service';

export async function GET() {
  try {
    const missingDataMovies = await prisma.movie.findMany({
      where: {
        OR: [
          { posterUrl: null },
          { synopsis: null },
          { releaseDate: null },
        ]
      },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        posterUrl: true,
        synopsis: true,
        releaseDate: true
      }
    });

    return NextResponse.json({ data: missingDataMovies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tmdbIds } = body;

    if (!Array.isArray(tmdbIds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const tmdbId of tmdbIds) {
      try {
        // Double check 1: Fetch directly from TMDB to see if they updated it
        const tmdbMovie = await getMovie(tmdbId);
        
        // Double check 2: Verify if the critical data actually exists in the TMDB response now
        const hasPosterNow = !!tmdbMovie.poster_path;
        const hasSynopsisNow = !!tmdbMovie.overview;

        if (hasPosterNow || hasSynopsisNow) {
          // Data is available on TMDB! Let's resync completely.
          await SyncService.importMovie(tmdbId);
          results.success++;
          results.details.push({ tmdbId, status: 'UPDATED', message: 'Found missing data and resynced' } as never);
        } else {
          // TMDB still doesn't have the data
          results.skipped++;
          results.details.push({ tmdbId, status: 'SKIPPED', message: 'TMDB still has no poster/synopsis for this movie' } as never);
        }
      } catch (error: any) {
        results.failed++;
        results.details.push({ tmdbId, status: 'FAILED', message: error.message } as never);
      }
      
      // Delay to avoid hitting TMDB rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
