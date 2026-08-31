import { prisma } from '../src/lib/prisma';
async function run() {
  const pending = await prisma.importJob.count({ where: { status: 'PENDING' } });
  const inProgress = await prisma.importJob.count({ where: { status: 'IN_PROGRESS' } });
  const completed = await prisma.importJob.count({ where: { status: 'COMPLETED' } });
  const failed = await prisma.importJob.count({ where: { status: 'FAILED' } });
  
  const total = await prisma.importJob.count();
  const movies = await prisma.movie.count();
  
  console.log('--- Database Status ---');
  console.log('Total Movies:', movies);
  console.log('Total Import Jobs in Queue:', total);
  console.log(' - PENDING:', pending);
  console.log(' - IN_PROGRESS:', inProgress);
  console.log(' - COMPLETED:', completed);
  console.log(' - FAILED:', failed);
}
run().finally(() => prisma.$disconnect());
