import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const payloadSchema = z.object({
  scope: z.enum(['catalog', 'homepage']).default('catalog'),
});

function secretsMatch(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATION_SECRET;
  if (!expected) return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });

  const authorization = request.headers.get('authorization') || '';
  const received = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!received || !secretsMatch(received, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid revalidation scope' }, { status: 400 });

  revalidatePath('/', 'page');
  revalidatePath('/opengraph-image', 'page');
  if (parsed.data.scope === 'catalog') {
    revalidatePath('/movies', 'page');
    revalidatePath('/popular', 'layout');
    revalidatePath('/genre', 'layout');
    revalidatePath('/origin', 'layout');
    revalidatePath('/year', 'layout');
    revalidatePath('/sitemap.xml', 'page');
    revalidatePath('/sitemaps', 'layout');
  }

  return NextResponse.json({ revalidated: true, scope: parsed.data.scope, at: new Date().toISOString() });
}
