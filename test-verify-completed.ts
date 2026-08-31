import { prisma } from './src/lib/prisma';

async function verify() {
  const completedJobs = await prisma.importJob.findMany({
    where: { status: 'COMPLETED' }
  });
  
  let successCount = 0;
  let missingCount = 0;

  for (const job of completedJobs) {
    const movie = await prisma.movie.findUnique({
      where: { tmdbId: job.tmdbId }
    });
    if (movie) {
      successCount++;
    } else {
      missingCount++;
      console.log('Missing movie for TMDB ID: ' + job.tmdbId);
    }
  }

  console.log('Total COMPLETED jobs: ' + completedJobs.length);
  console.log('Movies actually in DB: ' + successCount);
  console.log('Missing movies: ' + missingCount);
}
verify();
