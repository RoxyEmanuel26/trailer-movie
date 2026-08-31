import { prisma } from '../src/lib/prisma';

async function check() {
  const allMissing = await prisma.movie.count({
    where: {
      deletedAt: null,
      OR: [
        { posterUrl: null },
        { synopsis: null },
        { releaseDate: null },
        { budget: null },
        { revenue: null },
        { ageRating: null },
        { watchProviders: { equals: 'Prisma.DbNull' as any } }, // wait, Prisma.DbNull is tricky in raw scripts, let's just omit json for count or use undefined
        { keywords: { none: {} } },
        { companies: { none: {} } },
        { countries: { none: {} } },
        { languages: { none: {} } },
        { people: { none: {} } },
      ]
    }
  });

  const missingPeople = await prisma.movie.count({ where: { people: { none: {} } } });
  const missingCountries = await prisma.movie.count({ where: { countries: { none: {} } } });
  const missingLanguages = await prisma.movie.count({ where: { languages: { none: {} } } });
  
  const total = await prisma.movie.count();

  console.log('Total Movies in DB:', total);
  console.log('Total Movies missing ANY data (ignoring 7-day cooldown):', allMissing);
  console.log(' - Missing People:', missingPeople);
  console.log(' - Missing Countries:', missingCountries);
  console.log(' - Missing Languages:', missingLanguages);
}
check().finally(() => prisma.$disconnect());
