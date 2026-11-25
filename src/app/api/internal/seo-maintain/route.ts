import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasValidRevalidationSecret } from '@/lib/revalidation';
import { SeoGrowthService } from '@/lib/services/SeoGrowthService';
import { HOMEPAGE_CATALOG_TAG } from '@/lib/homepage-cache';

const payloadSchema = z.object({
  dryRun: z.boolean().default(false),
  submitIndexNow: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATION_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'Revalidation secret is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!hasValidRevalidationSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid maintenance payload' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const summary = await SeoGrowthService.runDailyMaintenance({
    dryRun: parsed.data.dryRun,
    submitIndexNow: parsed.data.submitIndexNow,
  });

  if (!parsed.data.dryRun && (summary.upcoming.promotedCount > 0 || summary.franchises.updatedCount > 0)) {
    try {
      revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
      revalidatePath('/');
      revalidatePath('/movies');
      revalidatePath('/upcoming', 'layout');
      revalidatePath('/collections');
      revalidatePath('/collection', 'layout');
      revalidatePath('/studios');
      revalidatePath('/studio', 'layout');
      revalidatePath('/themes');
      revalidatePath('/theme', 'layout');
      revalidatePath('/sitemap.xml');
      revalidatePath('/sitemaps', 'layout');
    } catch {
      // ignore if outside Next.js server store
    }
  }

  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
