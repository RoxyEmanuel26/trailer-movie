import { prisma } from '../src/lib/prisma';
import { getMovieExtra, getMovieCredits } from '../src/lib/tmdb/api';

async function run() {
  const noKeywords = await prisma.movie.findFirst({
    where: { keywords: { none: {} } },
    select: { tmdbId: true, title: true }
  });
  
  if (noKeywords && noKeywords.tmdbId) {
    console.log("Checking Movie missing Keywords: " + noKeywords.title + " (TMDB: " + noKeywords.tmdbId + ")");
    const tmdbData = await getMovieExtra(noKeywords.tmdbId);
    console.log("TMDB Raw Keywords Array Length:", tmdbData.keywords?.keywords?.length || 0);
    console.log("TMDB Raw Keywords Data:", tmdbData.keywords?.keywords);
  }
}

run().finally(() => prisma.$disconnect());
