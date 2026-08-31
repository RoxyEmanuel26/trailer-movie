import { prisma } from '../src/lib/prisma';
async function run() {
  const fields = ['title', 'originalTitle', 'synopsis', 'posterUrl', 'backdropUrl', 'youtubeTrailerId', 'ageRating', 'mpaaRating'];
  
  for (const field of fields) {
    const count = await prisma.movie.count({
      where: {
        [field]: { contains: 'Coming Soon', mode: 'insensitive' }
      }
    });
    if (count > 0) console.log(field, count);
  }
}
run().finally(() => prisma.$disconnect());
