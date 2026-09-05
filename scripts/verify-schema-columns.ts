import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function testQuery() {
  // 1. Check Movie model with new fields
  const sampleMovie = await prisma.movie.findFirst({
    select: {
      id: true,
      title: true,
      voteAverage: true,
      voteCount: true,
      popularity: true,
      tagline: true,
      logoUrl: true,
      originalLanguage: true,
      imdbId: true,
      homepage: true,
      productionStatus: true,
      adult: true,
      recommendationsFrom: { take: 1 },
      images: { take: 1 },
      alternativeTitles: { take: 1 },
      watchProviderLinks: { take: 1 },
      movieReviews: { take: 1 },
    }
  });

  console.log('✅ Prisma Movie query with new fields succeeded:', {
    id: sampleMovie?.id,
    title: sampleMovie?.title,
    voteAverage: sampleMovie?.voteAverage,
    adult: sampleMovie?.adult,
  });

  // 2. Check Person model with new fields
  const samplePerson = await prisma.person.findFirst({
    select: {
      id: true,
      name: true,
      imdbId: true,
      popularity: true,
    }
  });

  console.log('✅ Prisma Person query with new fields succeeded:', {
    id: samplePerson?.id,
    name: samplePerson?.name,
    popularity: samplePerson?.popularity,
  });

  // 3. Check new models are queryable
  const recCount = await prisma.movieRecommendation.count();
  const imgCount = await prisma.movieImage.count();
  const altTitleCount = await prisma.movieAlternativeTitle.count();
  const providerCount = await prisma.watchProvider.count();
  const linkCount = await prisma.movieWatchProviderLink.count();
  const reviewCount = await prisma.movieReview.count();

  console.log('✅ New tables queryable:', {
    recommendations: recCount,
    images: imgCount,
    altTitles: altTitleCount,
    providers: providerCount,
    links: linkCount,
    reviews: reviewCount,
  });
}

testQuery()
  .catch((e) => {
    console.error('❌ Query test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
