import { unstable_cache } from 'next/cache';
import { SeoService } from './services/SeoService';
import { SeoRepository } from './repositories/SeoRepository';

const loadMovieCountAndLastMod = async () => {
  const [movies, lastModified] = await Promise.all([
    SeoService.getMovieSitemapPageCount(),
    SeoRepository.getHomepageLastModified(),
  ]);
  return { movies, lastModified: lastModified ? lastModified.toISOString() : null };
};

const loadPersonCount = async () => SeoService.getPersonSitemapPageCount();

const cachedMovieMeta = unstable_cache(loadMovieCountAndLastMod, ['sitemap-movie-meta-v4'], { revalidate: 300 });
const cachedPersonCount = unstable_cache(loadPersonCount, ['sitemap-person-count-v4'], { revalidate: 3600 });

export async function getSitemapPageCounts(forceRefresh = false) {
  const [movieMeta, people] = await Promise.all([
    forceRefresh ? loadMovieCountAndLastMod() : cachedMovieMeta(),
    forceRefresh ? loadPersonCount() : cachedPersonCount(),
  ]);
  return [movieMeta.movies, people, movieMeta.lastModified] as const;
}
