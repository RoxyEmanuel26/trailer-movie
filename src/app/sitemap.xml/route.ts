import { serializeSitemapIndex, sitemapUnavailableResponse, xmlResponse, type SitemapIndexItem } from '@/lib/sitemap-xml';
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
      const [moviePageCount, personPageCount, latestModified] = await getSitemapPageCounts(forceRefresh);
      const sitemapItems: SitemapIndexItem[] = [
        {
          url: absoluteUrl('/sitemaps/core'),
          ...(latestModified ? { lastModified: latestModified } : {}),
        },
      ];

      for (let page = 0; page < moviePageCount; page += 1) {
        const isNewestShard = page === moviePageCount - 1;
        sitemapItems.push({
          url: absoluteUrl(`/sitemaps/movies-${page}`),
          ...(isNewestShard && latestModified ? { lastModified: latestModified } : {}),
        });
      }

      for (let page = 0; page < personPageCount; page += 1) {
        sitemapItems.push({ url: absoluteUrl(`/sitemaps/people-${page}`) });
      }

      return serializeSitemapIndex(sitemapItems);
    });
    return xmlResponse(result.xml, { stale: result.stale });
  } catch (error) {
    console.error('Sitemap index generation failed and no snapshot is available', error);
    return sitemapUnavailableResponse();
  }
}
