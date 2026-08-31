import { prisma } from './src/lib/prisma';

async function verifyAndDeleteFast() {
  try {
    console.log('Fetching completed jobs...');
    const completedJobs = await prisma.importJob.findMany({
      where: { status: 'COMPLETED' },
      select: { id: true, tmdbId: true }
    });
    console.log('Found ' + completedJobs.length + ' jobs. Verifying in batches...');
    
    const jobsToDelete: string[] = [];
    
    const batchSize = 500;
    for (let i = 0; i < completedJobs.length; i += batchSize) {
      const batch = completedJobs.slice(i, i + batchSize);
      const tmdbIds = batch.map(b => b.tmdbId);
      
      const moviesInDb = await prisma.movie.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true }
      });
      
      const dbTmdbIds = new Set(moviesInDb.map(m => m.tmdbId));
      
      for (const job of batch) {
        if (dbTmdbIds.has(job.tmdbId)) {
          jobsToDelete.push(job.id);
        } else {
          console.log('Missing movie for TMDB ID: ' + job.tmdbId);
        }
      }
    }

    if (jobsToDelete.length > 0) {
      console.log('Deleting ' + jobsToDelete.length + ' jobs...');
      const result = await prisma.importJob.deleteMany({
        where: { id: { in: jobsToDelete } }
      });
      console.log('Jobs successfully deleted from history to clear UI: ' + result.count);
    } else {
      console.log('No valid COMPLETED jobs to delete.');
    }
  } finally {
    await prisma.$disconnect();
  }
}
verifyAndDeleteFast();
