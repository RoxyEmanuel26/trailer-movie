import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemapIndex, xmlResponse } from '@/lib/sitemap-xml';
import { absoluteUrl } from '@/lib/site-config';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getSitemapPageCounts = unstable_cache(
  () => Promise.all([SeoService.getMovieSitemapPageCount(), SeoService.getPersonSitemapPageCount()]),
  ['sitemap-index-page-counts'],
  { revalidate: 3600 },
);

export async function GET() {
  const [moviePageCount, personPageCount] = await getSitemapPageCounts();
  const sitemapUrls = [absoluteUrl('/sitemaps/core')];

  for (let page = 0; page < moviePageCount; page += 1) {
    sitemapUrls.push(absoluteUrl(`/sitemaps/movies-${page}`));
  }

  for (let page = 0; page < personPageCount; page += 1) {
    sitemapUrls.push(absoluteUrl(`/sitemaps/people-${page}`));
  }

  return xmlResponse(serializeSitemapIndex(sitemapUrls));
}
