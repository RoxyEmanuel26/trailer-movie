import { NextResponse } from 'next/server';
import { SeoService } from '@/lib/services/SeoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const xml = await SeoService.generateRssFeed();

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600',
      'CDN-Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
    },
  });
}
