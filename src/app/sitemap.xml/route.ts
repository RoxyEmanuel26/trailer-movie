import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemapIndex, xmlResponse } from '@/lib/sitemap-xml';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export async function GET() {
  const personPageCount = await SeoService.getPersonSitemapPageCount();
  const sitemapUrls = [`${APP_URL}/sitemaps/core`];

  for (let page = 0; page < personPageCount; page += 1) {
    sitemapUrls.push(`${APP_URL}/sitemaps/people-${page}`);
  }

  return xmlResponse(serializeSitemapIndex(sitemapUrls));
}
