import { prisma } from '../src/lib/prisma';

async function run() {
  const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
  
  // Find all movies missing anything
  const missingMovies = await prisma.movie.findMany({
    where: {
      deletedAt: null,
      OR: [
        { posterUrl: null },
        { synopsis: null },
        { releaseDate: null },
        { budget: null },
        { revenue: null },
        { ageRating: null },
        { keywords: { none: {} } },
        { companies: { none: {} } },
        { countries: { none: {} } },
        { languages: { none: {} } },
        { people: { none: {} } },
      ]
    },
    select: { id: true }
  });

  const ids = missingMovies.map(m => m.id);
  
  if (ids.length > 0) {
    const res = await prisma.movie.updateMany({
      where: { id: { in: ids } },
      data: { updatedAt: oldDate }
    });
    console.log('Successfully bypassed cooldown for ' + res.count + ' movies.');
  } else {
    console.log('No missing movies found.');
  }
}

run().finally(() => prisma.$disconnect());
