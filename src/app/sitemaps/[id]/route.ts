import { notFound } from 'next/navigation';
import { SeoService } from '@/lib/services/SeoService';
import { serializeSitemap, sitemapUnavailableResponse, xmlResponse } from '@/lib/sitemap-xml';
import { generateSitemapWithFallback, readSitemapSnapshot } from '@/lib/sitemap-cache';
import { hasValidRevalidationSecret } from '@/lib/revalidation';
import { getSitemapPageCounts } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

function rethrowNotFound(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')
  ) {
    throw error;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Version snapshots when eligibility or shard boundaries change, without
  // changing the public sitemap URLs or serving old overlapping shards.
  const snapshotKey = `v3-${id}`;
  const forceRefresh = hasValidRevalidationSecret(request);

  if (id === 'core') {
    try {
      const freshSnapshot = forceRefresh ? null : await readSitemapSnapshot(snapshotKey);
      if (freshSnapshot) return xmlResponse(freshSnapshot);
      const result = await generateSitemapWithFallback(snapshotKey, async () =>
        serializeSitemap(await SeoService.generateSitemapData()),
      );
      return xmlResponse(result.xml, { stale: result.stale });
    } catch (error) {
      console.error('Core sitemap generation failed and no snapshot is available', error);
      return sitemapUnavailableResponse();
    }
  }

  const movieMatch = id.match(/^movies-(0|[1-9]\d*)$/);
  if (movieMatch) {
    const page = Number(movieMatch[1]);
    if (!Number.isSafeInteger(page) || page < 0) notFound();
    try {
      const result = await generateSitemapWithFallback(snapshotKey, async () => {
        const [pageCount] = await getSitemapPageCounts(forceRefresh);
        if (page >= pageCount) notFound();
        const freshSnapshot = forceRefresh ? null : await readSitemapSnapshot(snapshotKey);
        if (freshSnapshot) return freshSnapshot;
        return serializeSitemap(await SeoService.generateMovieSitemapData(page));
      });
      return xmlResponse(result.xml, { stale: result.stale });
    } catch (error) {
      rethrowNotFound(error);
      console.error(`Movie sitemap ${id} generation failed and no snapshot is available`, error);
      return sitemapUnavailableResponse();
    }
  }

  const match = id.match(/^people-(0|[1-9]\d*)$/);
  if (!match) notFound();

  const page = Number(match[1]);
  if (!Number.isSafeInteger(page) || page < 0) notFound();
  try {
    const result = await generateSitemapWithFallback(snapshotKey, async () => {
      const [, pageCount] = await getSitemapPageCounts(forceRefresh);
      if (page >= pageCount) notFound();
      const freshSnapshot = forceRefresh ? null : await readSitemapSnapshot(snapshotKey);
      if (freshSnapshot) return freshSnapshot;
      return serializeSitemap(await SeoService.generatePersonSitemapData(page));
    });
    return xmlResponse(result.xml, { stale: result.stale });
  } catch (error) {
    rethrowNotFound(error);
    console.error(`Person sitemap ${id} generation failed and no snapshot is available`, error);
    return sitemapUnavailableResponse();
  }
}
