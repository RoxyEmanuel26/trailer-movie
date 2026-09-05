import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { getMovieEnriched } from '../src/lib/tmdb/api';
import { EnrichmentService } from '../src/lib/services/enrichment-service';

// Parse command-line arguments
const args = process.argv.slice(2);
const hasAllFlag = args.includes('--all');
const forceFlag = args.includes('--force');

const limitArgIndex = args.indexOf('--limit');
const limitValue = limitArgIndex !== -1 && args[limitArgIndex + 1] ? parseInt(args[limitArgIndex + 1], 10) : null;

const batchSizeArgIndex = args.indexOf('--batch-size');
const batchSize = batchSizeArgIndex !== -1 && args[batchSizeArgIndex + 1] ? parseInt(args[batchSizeArgIndex + 1], 10) : 25;

const delayArgIndex = args.indexOf('--delay');
const throttleDelayMs = delayArgIndex !== -1 && args[delayArgIndex + 1] ? parseInt(args[delayArgIndex + 1], 10) : 60;

// Default limit is 20 if --all is not passed
const totalLimit = hasAllFlag ? Infinity : (limitValue ?? 20);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBackfill() {
  console.log('========================================================================');
  console.log('🎬 TMDB Catalog Enrichment Backfill (Phase 3)');
  console.log('========================================================================');
  console.log(`• Mode:            ${hasAllFlag ? 'Process ALL unenriched movies' : `Process up to ${totalLimit} movies`}`);
  console.log(`• Batch Size:      ${batchSize}`);
  console.log(`• Throttle Delay:  ${throttleDelayMs}ms per request`);
  console.log(`• Force Re-enrich: ${forceFlag ? 'YES' : 'NO (Only NULL voteAverage/popularity)'}`);
  console.log('========================================================================\n');

  const startTime = Date.now();

  // 1. Check total remaining movies to enrich
  const totalUnenrichedInDb = await prisma.movie.count({
    where: forceFlag
      ? { tmdbId: { not: null } }
      : {
          tmdbId: { not: null },
          OR: [{ voteAverage: null }, { popularity: null }],
        },
  });

  console.log(`📊 Total unenriched movies in DB: ${totalUnenrichedInDb.toLocaleString()}`);

  if (totalUnenrichedInDb === 0) {
    console.log('✨ All movies are already enriched! Nothing to process.');
    return;
  }

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalNotFound = 0;
  let totalFailed = 0;

  const maxToProcess = Math.min(totalLimit, totalUnenrichedInDb);
  console.log(`🎯 Target to process in this run: ${maxToProcess.toLocaleString()} movies\n`);

  while (totalProcessed < maxToProcess) {
    const currentTake = Math.min(batchSize, maxToProcess - totalProcessed);

    // Fetch next batch of movies
    const movies = await prisma.movie.findMany({
      where: forceFlag
        ? { tmdbId: { not: null } }
        : {
            tmdbId: { not: null },
            OR: [{ voteAverage: null }, { popularity: null }],
          },
      select: {
        id: true,
        tmdbId: true,
        title: true,
      },
      orderBy: { createdAt: 'desc' },
      take: currentTake,
    });

    if (movies.length === 0) {
      break;
    }

    for (const movie of movies) {
      if (!movie.tmdbId) continue;
      totalProcessed++;
      const movieStart = Date.now();
      const progressLabel = `[${totalProcessed}/${maxToProcess}]`;

      try {
        // Fetch complete enriched data from TMDB in 1 single HTTP request
        const tmdbData = await getMovieEnriched(movie.tmdbId);

        // Store into database via EnrichmentService
        const res = await EnrichmentService.enrichMovie(movie.id, tmdbData);

        const duration = Date.now() - movieStart;
        totalSuccess++;

        console.log(
          `${progressLabel} ✅ TMDB ${movie.tmdbId} "${movie.title}" (${duration}ms) -> ` +
            `vote: ${tmdbData.vote_average ?? '-'} (${tmdbData.vote_count ?? 0}), pop: ${Math.round(tmdbData.popularity ?? 0)} | ` +
            `imgs: ${res.imagesCount}, alts: ${res.altTitlesCount}, provs: ${res.watchProvidersCount}, revs: ${res.reviewsCount}, recs: ${res.recommendationsCount}, people: ${res.peopleUpdatedCount}`
        );
      } catch (err: any) {
        const duration = Date.now() - movieStart;
        const is404 = err?.status === 404 || err?.message?.includes('404');

        if (is404) {
          totalNotFound++;
          console.warn(
            `${progressLabel} ⚠️ TMDB ${movie.tmdbId} "${movie.title}" (${duration}ms) -> 404 Not Found on TMDB. Marking to prevent retry.`
          );
          // Set safe sentinel so it doesn't get queried again
          await prisma.movie.update({
            where: { id: movie.id },
            data: {
              voteAverage: 0,
              voteCount: 0,
              popularity: 0,
              productionStatus: 'NOT_FOUND_ON_TMDB',
              updatedAt: new Date(),
            },
          });
        } else {
          totalFailed++;
          console.error(
            `${progressLabel} ❌ TMDB ${movie.tmdbId} "${movie.title}" (${duration}ms) -> Error: ${err?.message || err}`
          );
        }
      }

      // Respect TMDB rate limits
      if (throttleDelayMs > 0) {
        await sleep(throttleDelayMs);
      }
    }
  }

  const totalTimeSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgTimePerMovie = totalProcessed > 0 ? (Math.round((Date.now() - startTime) / totalProcessed)) : 0;

  console.log('\n========================================================================');
  console.log('🏁 Ringkasan Hasil Backfill');
  console.log('========================================================================');
  console.log(`• Total Diproses:       ${totalProcessed}`);
  console.log(`• Berhasil Diperkaya:   ${totalSuccess} ✅`);
  console.log(`• 404 (Dihapus TMDB):   ${totalNotFound} ⚠️`);
  console.log(`• Gagal (Error):        ${totalFailed} ❌`);
  console.log(`• Total Waktu:          ${totalTimeSeconds} detik`);
  console.log(`• Rata-rata per Film:   ${avgTimePerMovie} ms`);
  console.log('========================================================================\n');
}

runBackfill()
  .catch((err) => {
    console.error('Fatal backfill error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
