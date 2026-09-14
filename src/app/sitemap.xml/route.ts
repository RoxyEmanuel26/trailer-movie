import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemapIndex, xmlResponse } from '@/lib/sitemap-xml';
import { absoluteUrl } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [moviePageCount, personPageCount] = await Promise.all([
    SeoService.getMovieSitemapPageCount(),
    SeoService.getPersonSitemapPageCount(),
  ]);
  const sitemapUrls = [absoluteUrl('/sitemaps/core')];

  for (let page = 0; page < moviePageCount; page += 1) {
    sitemapUrls.push(absoluteUrl(`/sitemaps/movies-${page}`));
  }

  for (let page = 0; page < personPageCount; page += 1) {
    sitemapUrls.push(absoluteUrl(`/sitemaps/people-${page}`));
  }

  return xmlResponse(serializeSitemapIndex(sitemapUrls));
}
