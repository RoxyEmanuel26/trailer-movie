import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function inspectEnrichedMovie() {
  const movie = await prisma.movie.findFirst({
    where: { tmdbId: 911430 },
    include: {
      images: true,
      alternativeTitles: { take: 5 },
      watchProviderLinks: {
        include: { provider: true },
        take: 5,
      },
      movieReviews: { take: 2 },
      recommendationsFrom: {
        include: { targetMovie: { select: { title: true, tmdbId: true } } },
        take: 5,
      },
      people: {
        include: { person: true },
        take: 5,
      },
    },
  });

  console.log('Movie Details:', {
    id: movie?.id,
    title: movie?.title,
    tagline: movie?.tagline,
    voteAverage: movie?.voteAverage,
    voteCount: movie?.voteCount,
    popularity: movie?.popularity,
    logoUrl: movie?.logoUrl,
    productionStatus: movie?.productionStatus,
    originalLanguage: movie?.originalLanguage,
    imagesCount: movie?.images.length,
    altTitlesCount: movie?.alternativeTitles.length,
    watchProvidersSample: movie?.watchProviderLinks.map((w) => ({
      country: w.countryCode,
      access: w.accessType,
      provider: w.provider.name,
    })),
    reviewsSample: movie?.movieReviews.map((r) => ({
      author: r.author,
      rating: r.rating,
      contentSnippet: r.content.slice(0, 80) + '...',
    })),
  });
}

inspectEnrichedMovie()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
