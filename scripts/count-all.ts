import { prisma } from '../src/lib/prisma';

async function run() {
  const m = await prisma.movie.count();
  const k = await prisma.keyword.count();
  const c = await prisma.productionCompany.count();
  console.log('Movies:', m);
  console.log('Keywords:', k);
  console.log('Companies:', c);
}
run().finally(() => prisma.$disconnect());
