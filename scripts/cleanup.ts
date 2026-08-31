import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const completed = await prisma.importJob.findMany({ where: { status: 'COMPLETED' } });
  
  const toDelete = [];
  for (const job of completed) {
    const movie = await prisma.movie.findUnique({ where: { tmdbId: job.tmdbId } });
    if (movie) toDelete.push(job.id);
  }
  
  if (toDelete.length > 0) {
    const res = await prisma.importJob.deleteMany({ where: { id: { in: toDelete } } });
    console.log('Deleted: ' + res.count);
  } else {
    console.log('Deleted: 0');
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
