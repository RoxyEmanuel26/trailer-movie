import { prisma } from '../src/lib/prisma';
async function run() {
  const count = await prisma.movie.count({
    where: {
      synopsis: { contains: 'Coming Soon', mode: 'insensitive' }
    }
  });
  console.log('Movies with synopsis containing "Coming Soon":', count);
}
run().finally(() => prisma.$disconnect());
