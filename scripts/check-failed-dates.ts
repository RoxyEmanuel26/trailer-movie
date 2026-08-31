import { prisma } from '../src/lib/prisma';
async function run() {
  const jobs = await prisma.importJob.findMany({ where: { status: 'FAILED' } });
  jobs.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
  console.log('Oldest FAILED job:', jobs[0]?.createdAt);
  console.log('Newest FAILED job:', jobs[jobs.length - 1]?.createdAt);
}
run();
