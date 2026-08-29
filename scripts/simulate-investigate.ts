import { SyncService } from '../src/lib/services/import-service';
import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

async function run() {
  console.log('Fetching missing movies...');
  const missingDataMovies = await prisma.movie.findMany({
    where: {
      deletedAt: null,
      OR: [
        { posterUrl: null },
        { synopsis: null },
        { releaseDate: null },
        { budget: null },
        { revenue: null },
        { ageRating: null },
        { watchProviders: { equals: Prisma.DbNull } },
        { reviews: { equals: Prisma.DbNull } },
        { keywords: { none: {} } },
        { companies: { none: {} } },
      ]
    },
    select: { id: true, tmdbId: true }
  });
  
  console.log('Found ' + missingDataMovies.length + ' missing movies.');
  if (missingDataMovies.length === 0) return;

  const testSample = missingDataMovies.slice(0, 50);
  console.log('Testing with sample of ' + testSample.length + ' movies...');

  const CHUNK_SIZE = 25;
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < testSample.length; i += CHUNK_SIZE) {
    const chunk = testSample.slice(i, i + CHUNK_SIZE);
    const chunkStart = Date.now();
    console.log('Processing chunk ' + (Math.floor(i/CHUNK_SIZE) + 1) + ' (' + chunk.length + ' movies)...');

    for (const movie of chunk) {
      try {
        await SyncService.patchMissingData(movie.tmdbId);
        successCount++;
      } catch (e: any) {
        console.error('Error on TMDB ' + movie.tmdbId + ':', e.message);
        failCount++;
      }
    }
    
    console.log('Chunk ' + (Math.floor(i/CHUNK_SIZE) + 1) + ' finished in ' + (Date.now() - chunkStart) + 'ms');
  }

  const totalTime = Date.now() - startTime;
  console.log('--- Simulation Complete ---');
  console.log('Total Time: ' + totalTime + 'ms');
  console.log('Success: ' + successCount);
  console.log('Failed: ' + failCount);
  console.log('Avg time per movie: ' + Math.round(totalTime / testSample.length) + 'ms');
}
run().catch(console.error).finally(() => prisma.$disconnect());
