import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasValidRevalidationSecret, isAllowedRevalidationPath } from '@/lib/revalidation';

const payloadSchema = z.object({
  scope: z.enum(['catalog', 'homepage']).default('catalog'),
  paths: z.array(z.string().min(1).max(300)).max(100).default([]),
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

  invalidate('/');
  revalidatePath('/opengraph-image', 'page');
  if (parsed.data.scope === 'catalog') {
    invalidate('/', 'layout');
    invalidate('/movies');
    invalidate('/genres');
    invalidate('/countries');
    invalidate('/years');
    invalidate('/popular', 'layout');
    invalidate('/genre', 'layout');
    invalidate('/origin', 'layout');
    invalidate('/year', 'layout');
    invalidate('/feed.xml');
    invalidate('/sitemap.xml');
    invalidate('/sitemaps', 'layout');
    for (const path of requestedPaths) invalidate(path);
  }

  return NextResponse.json({
    revalidated: true,
    scope: parsed.data.scope,
    sitemapRefreshAuthorized: parsed.data.refreshSitemaps,
    paths: [...revalidated],
    at: new Date().toISOString(),
  });
}
