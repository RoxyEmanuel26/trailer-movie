import { serializeSitemapIndex, sitemapUnavailableResponse, xmlResponse } from '@/lib/sitemap-xml';
import { generateSitemapWithFallback, readSitemapSnapshot, sitemapSnapshotKey } from '@/lib/sitemap-cache';
import { absoluteUrl } from '@/lib/site-config';
import { getSitemapPageCounts } from '@/lib/sitemap-data';
import { hasValidRevalidationSecret } from '@/lib/revalidation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const snapshotKey = sitemapSnapshotKey('sitemap-index');
    const forceRefresh = hasValidRevalidationSecret(request);
    const freshSnapshot = forceRefresh
      ? null
      : await readSitemapSnapshot(snapshotKey);
    if (freshSnapshot) return xmlResponse(freshSnapshot);
    const result = await generateSitemapWithFallback(snapshotKey, async () => {
      const [moviePageCount, personPageCount] = await getSitemapPageCounts(forceRefresh);
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
