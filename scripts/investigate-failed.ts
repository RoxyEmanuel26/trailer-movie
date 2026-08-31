import { prisma } from '../src/lib/prisma';

async function run() {
  try {
    const failedJobs = await prisma.importJob.findMany({
      where: { status: 'FAILED' }
    });
    
    console.log('Total FAILED jobs: ' + failedJobs.length);
    
    const screenshotIds = [1720327, 1717715, 691267, 1689360, 1724890, 1725575];
    console.log('\n--- Details of some failures ---');
    for (const id of screenshotIds) {
      const job = await prisma.importJob.findFirst({ where: { tmdbId: id }, orderBy: { createdAt: 'desc' } });
      console.log('TMDB ID ' + id + ':');
      console.log(JSON.stringify(job?.logs, null, 2));
    }

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
