import { prisma } from '../src/lib/prisma';
async function run() {
  const ids = [1747222, 1750513];
  for (const id of ids) {
    const job = await prisma.importJob.findFirst({ where: { tmdbId: id }, orderBy: { updatedAt: 'desc' } });
    if (job) {
      console.log('TMDB ID:', id, 'Status:', job.status, 'Updated At:', job.updatedAt);
      console.log(JSON.stringify(job.logs, null, 2));
    } else {
      console.log('TMDB ID:', id, 'Not found in ImportJob table.');
    }
  }
}
run().finally(() => prisma.$disconnect());
