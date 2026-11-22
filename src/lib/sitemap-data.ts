import { unstable_cache } from 'next/cache';
import { MOVIE_SITEMAP_PAGE_SIZE, SeoService } from './services/SeoService';
import { SeoRepository } from './repositories/SeoRepository';

let lastKnownPersonPageCount: number | null = null;
let lastPersonCountAt = 0;
let inFlightPersonCount: Promise<number> | null = null;

let lastKnownMoviesLikePageCount: number | null = null;
let lastMoviesLikeCountAt = 0;
let inFlightMoviesLikeCount: Promise<number> | null = null;

const loadMovieCountAndLastMod = async () => {
  const [shardStats, lastModified] = await Promise.all([
    SeoRepository.listMovieSitemapShardStats(MOVIE_SITEMAP_PAGE_SIZE),
    SeoRepository.getHomepageLastModified(),
  ]);
  const shardLastModified = shardStats.map((entry) =>
    entry.lastModified ? entry.lastModified.toISOString() : null,
  );
  return {
    movies: shardStats.length,
    shardLastModified,
    lastModified: lastModified ? lastModified.toISOString() : null,
  };
};

const loadPersonCount = async () => {
  // Reuse the in-memory person page count for up to 2 hours even across
  // forceRefresh calls so catalog revalidations never saturate the DB pool
  // scanning 3M movie_people rows just to compute the sitemap index.
  if (lastKnownPersonPageCount !== null && Date.now() - lastPersonCountAt < 2 * 3_600_000) {
    return lastKnownPersonPageCount;
  }
  if (inFlightPersonCount) {
    return inFlightPersonCount;
  }
  inFlightPersonCount = SeoService.getPersonSitemapPageCount()
    .then((count) => {
      lastKnownPersonPageCount = count;
      lastPersonCountAt = Date.now();
      return count;
    })
    .finally(() => {
      inFlightPersonCount = null;
    });
  return inFlightPersonCount;
};

const loadMoviesLikeCount = async () => {
  if (lastKnownMoviesLikePageCount !== null && Date.now() - lastMoviesLikeCountAt < 2 * 3_600_000) {
    return lastKnownMoviesLikePageCount;
  }
  if (inFlightMoviesLikeCount) {
    return inFlightMoviesLikeCount;
  }
  inFlightMoviesLikeCount = SeoService.getMoviesLikeSitemapPageCount()
    .then((count) => {
      lastKnownMoviesLikePageCount = count;
      lastMoviesLikeCountAt = Date.now();
      return count;
    })
    .finally(() => {
      inFlightMoviesLikeCount = null;
    });
  return inFlightMoviesLikeCount;
};

const cachedMovieMeta = unstable_cache(loadMovieCountAndLastMod, ['sitemap-movie-meta-v5'], { revalidate: 300 });
const cachedPersonCount = unstable_cache(loadPersonCount, ['sitemap-person-count-v4'], { revalidate: 3600 });
const cachedMoviesLikeCount = unstable_cache(loadMoviesLikeCount, ['sitemap-movies-like-count-v1'], { revalidate: 3600 });

export async function getMovieSitemapPageCountCached(forceRefresh = false) {
  const movieMeta = await (forceRefresh ? loadMovieCountAndLastMod() : cachedMovieMeta());
  return movieMeta.movies;
}

export async function getPersonSitemapPageCountCached(forceRefresh = false) {
  return forceRefresh ? loadPersonCount() : cachedPersonCount();
}

export async function getMoviesLikeSitemapPageCountCached(forceRefresh = false) {
  return forceRefresh ? loadMoviesLikeCount() : cachedMoviesLikeCount();
}

export async function getSitemapPageCounts(forceRefresh = false) {
  const [movieMeta, people, moviesLike] = await Promise.all([
    forceRefresh ? loadMovieCountAndLastMod() : cachedMovieMeta(),
    forceRefresh ? loadPersonCount() : cachedPersonCount(),
    forceRefresh ? loadMoviesLikeCount() : cachedMoviesLikeCount(),
  ]);
  return [movieMeta.movies, people, movieMeta.lastModified, movieMeta.shardLastModified, moviesLike] as const;
}
