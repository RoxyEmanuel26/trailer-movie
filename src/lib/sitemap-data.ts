import { unstable_cache } from 'next/cache';
import { SeoService } from './services/SeoService';
import { SeoRepository } from './repositories/SeoRepository';

let lastKnownPersonPageCount: number | null = null;
let lastPersonCountAt = 0;

const loadMovieCountAndLastMod = async () => {
  const [movies, lastModified] = await Promise.all([
    SeoService.getMovieSitemapPageCount(),
    SeoRepository.getHomepageLastModified(),
  ]);
  return { movies, lastModified: lastModified ? lastModified.toISOString() : null };
};

const loadPersonCount = async () => {
  // Reuse the in-memory person page count for up to 2 hours even across
  // forceRefresh calls so catalog revalidations never saturate the DB pool
  // scanning 3M movie_people rows just to compute the sitemap index.
  if (lastKnownPersonPageCount !== null && Date.now() - lastPersonCountAt < 2 * 3_600_000) {
    return lastKnownPersonPageCount;
  }
  const count = await SeoService.getPersonSitemapPageCount();
  lastKnownPersonPageCount = count;
  lastPersonCountAt = Date.now();
  return count;
};

const cachedMovieMeta = unstable_cache(loadMovieCountAndLastMod, ['sitemap-movie-meta-v4'], { revalidate: 300 });
const cachedPersonCount = unstable_cache(loadPersonCount, ['sitemap-person-count-v4'], { revalidate: 3600 });

export async function getMovieSitemapPageCountCached(forceRefresh = false) {
  const movieMeta = await (forceRefresh ? loadMovieCountAndLastMod() : cachedMovieMeta());
  return movieMeta.movies;
}

export async function getPersonSitemapPageCountCached(forceRefresh = false) {
  return forceRefresh ? loadPersonCount() : cachedPersonCount();
}

export async function getSitemapPageCounts(forceRefresh = false) {
  const [movieMeta, people] = await Promise.all([
    forceRefresh ? loadMovieCountAndLastMod() : cachedMovieMeta(),
    forceRefresh ? loadPersonCount() : cachedPersonCount(),
  ]);
  return [movieMeta.movies, people, movieMeta.lastModified] as const;
}
