import { prisma } from '../src/lib/prisma';

async function run() {
  const count = await prisma.movie.count();
  console.log('Total movies in database:', count);
}

run().finally(() => prisma.$disconnect());
