import { unstable_cache } from 'next/cache';
import { SeoService } from './services/SeoService';

const loadCounts = async () => {
  // Bound database pressure; both queries can scan a large catalog.
  const movies = await SeoService.getMovieSitemapPageCount();
  const people = await SeoService.getPersonSitemapPageCount();
  return [movies, people] as const;
};

const cachedCounts = unstable_cache(loadCounts, ['sitemap-index-page-counts-v3'], { revalidate: 300 });
export function getSitemapPageCounts(forceRefresh = false) {
  return forceRefresh ? loadCounts() : cachedCounts();
}
