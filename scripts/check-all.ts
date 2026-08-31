import { prisma } from '../src/lib/prisma';
async function run() {
  const jobs = await prisma.importJob.findMany({ take: 5 });
  console.log('Jobs:', jobs);
  const count = await prisma.importJob.count();
  console.log('Total jobs:', count);
}
run().finally(() => prisma.$disconnect());
