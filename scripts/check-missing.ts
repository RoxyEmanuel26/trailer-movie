import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

async function run() {
  const missingDataMovies = await prisma.movie.findMany({
    where: {
      deletedAt: null,
      OR: [
        { posterUrl: null },
        { synopsis: null },
        { releaseDate: null },
        { keywords: { none: {} } },
        { companies: { none: {} } },
        { countries: { none: {} } },
        { languages: { none: {} } },
        { people: { none: {} } },
        { synopsis: { contains: 'coming soon', mode: 'insensitive' } },
        { posterUrl: { contains: 'coming soon', mode: 'insensitive' } },
        { youtubeTrailerId: { contains: 'coming soon', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      posterUrl: true,
      synopsis: true,
      releaseDate: true,
      youtubeTrailerId: true,
      _count: {
        select: {
          keywords: true,
          companies: true,
          countries: true,
          languages: true,
          people: true,
        }
      }
    }
  });

  console.log('Total Missing:', missingDataMovies.length);

  const stats = {
    missingPoster: 0,
    missingSynopsis: 0,
    missingReleaseDate: 0,
    missingKeywords: 0,
    missingCompanies: 0,
    missingCountries: 0,
    missingLanguages: 0,
    missingPeople: 0,
    comingSoonSynopsis: 0,
    comingSoonPoster: 0,
    comingSoonTrailer: 0,
  };

  for (const m of missingDataMovies) {
    if (!m.posterUrl) stats.missingPoster++;
    if (!m.synopsis) stats.missingSynopsis++;
    if (!m.releaseDate) stats.missingReleaseDate++;
    if (m._count.keywords === 0) stats.missingKeywords++;
    if (m._count.companies === 0) stats.missingCompanies++;
    if (m._count.countries === 0) stats.missingCountries++;
    if (m._count.languages === 0) stats.missingLanguages++;
    if (m._count.people === 0) stats.missingPeople++;
    if (m.synopsis?.toLowerCase().includes('coming soon')) stats.comingSoonSynopsis++;
    if (m.posterUrl?.toLowerCase().includes('coming soon')) stats.comingSoonPoster++;
    if (m.youtubeTrailerId?.toLowerCase().includes('coming soon')) stats.comingSoonTrailer++;
  }

  console.table(stats);
}

run().finally(() => prisma.$disconnect());
