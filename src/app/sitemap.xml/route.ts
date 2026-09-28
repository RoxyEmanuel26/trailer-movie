import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemapIndex, sitemapUnavailableResponse, xmlResponse } from '@/lib/sitemap-xml';
import { generateSitemapWithFallback, readSitemapSnapshot } from '@/lib/sitemap-cache';
import { absoluteUrl } from '@/lib/site-config';
import { unstable_cache } from 'next/cache';
import { hasValidRevalidationSecret } from '@/lib/revalidation';

export const dynamic = 'force-dynamic';

const loadSitemapPageCounts = () =>
  Promise.all([SeoService.getMovieSitemapPageCount(), SeoService.getPersonSitemapPageCount()]);

const getCachedSitemapPageCounts = unstable_cache(
  loadSitemapPageCounts,
  ['sitemap-index-page-counts'],
  { revalidate: 300 },
);

export async function GET(request: Request) {
  try {
    const forceRefresh = hasValidRevalidationSecret(request);
    const freshSnapshot = forceRefresh
      ? null
      : await readSitemapSnapshot('sitemap-index');
    if (freshSnapshot) return xmlResponse(freshSnapshot);
    const result = await generateSitemapWithFallback('sitemap-index', async () => {
      const [moviePageCount, personPageCount] = forceRefresh
        ? await loadSitemapPageCounts()
        : await getCachedSitemapPageCounts();
      const sitemapUrls = [absoluteUrl('/sitemaps/core')];

      for (let page = 0; page < moviePageCount; page += 1) {
        sitemapUrls.push(absoluteUrl(`/sitemaps/movies-${page}`));
      }

      for (let page = 0; page < personPageCount; page += 1) {
        sitemapUrls.push(absoluteUrl(`/sitemaps/people-${page}`));
      }

      return serializeSitemapIndex(sitemapUrls);
    });
    return xmlResponse(result.xml, { stale: result.stale });
  } catch (error) {
    console.error('Sitemap index generation failed and no snapshot is available', error);
    return sitemapUnavailableResponse();
  }
}
