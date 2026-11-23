import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasValidRevalidationSecret, isAllowedRevalidationPath } from '@/lib/revalidation';
import { HOMEPAGE_CATALOG_TAG } from '@/lib/homepage-cache';
import { coreIndexNowPaths, submitIndexNowUrls } from '@/lib/indexnow';
import { clearAllPublicMemoryCaches } from '@/lib/memory-cache';

const payloadSchema = z.object({
  scope: z.enum(['catalog', 'homepage']).default('catalog'),
  paths: z.array(z.string().min(1).max(300)).max(250).default([]),
  refreshSitemaps: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATION_SECRET;
  if (!expected) return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });

  if (!hasValidRevalidationSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid revalidation scope' }, { status: 400 });

  const requestedPaths = parsed.data.paths;
  if (requestedPaths.some((path) => !isAllowedRevalidationPath(path))) {
    return NextResponse.json({ error: 'One or more revalidation paths are not allowed' }, { status: 400 });
  }

  const revalidated = new Set<string>();
  const invalidate = (path: string, type: 'page' | 'layout' = 'page') => {
    revalidatePath(path, type);
    revalidated.add(path);
  };

  clearAllPublicMemoryCaches();
  invalidate('/');
  revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
  revalidatePath('/opengraph-image', 'page');
  if (parsed.data.scope === 'catalog') {
    // Do not evict every watch/person page on each import batch. Those pages
    // have a one-hour ISR TTL; requested detail paths may still be targeted.
    invalidate('/movies');
    invalidate('/upcoming', 'layout');
    invalidate('/collections');
    invalidate('/studios');
    invalidate('/themes');
    invalidate('/genres');
    invalidate('/countries');
    invalidate('/years');
    invalidate('/popular', 'layout');
    invalidate('/genre', 'layout');
    invalidate('/collection', 'layout');
    invalidate('/studio', 'layout');
    invalidate('/theme', 'layout');
    invalidate('/origin', 'layout');
    invalidate('/year', 'layout');
    invalidate('/streaming', 'layout');
    invalidate('/feed.xml');
    invalidate('/llms.txt');
    if (parsed.data.refreshSitemaps) {
      invalidate('/sitemap.xml');
      invalidate('/sitemaps', 'layout');
      const trigger = (globalThis as { __movieflixTriggerSitemapRefresh?: () => void })
        .__movieflixTriggerSitemapRefresh;
      if (typeof trigger === 'function') {
        trigger();
      }
    }
    for (const path of requestedPaths) invalidate(path);
    void submitIndexNowUrls([...coreIndexNowPaths(), ...requestedPaths]);
  }

  return NextResponse.json({
    revalidated: true,
    scope: parsed.data.scope,
    sitemapRefreshAuthorized: parsed.data.scope === 'catalog' && parsed.data.refreshSitemaps,
    paths: [...revalidated],
    at: new Date().toISOString(),
  });
}
