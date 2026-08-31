import { prisma } from '../src/lib/prisma';
import { SyncService } from '../src/lib/services/import-service';

async function run() {
  const tmdbId = 1720327; // one of the failed IDs
  try {
    console.log('Testing import for ' + tmdbId);
    const movie = await SyncService.importMovie(tmdbId);
    console.log('Success! DB ID: ' + movie.id);
  } catch(e) {
    console.error('Still failing:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
