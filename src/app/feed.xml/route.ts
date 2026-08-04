import { NextRequest, NextResponse } from 'next/server';
import { SeoService } from '@/lib/services/SeoService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const xml = await SeoService.generateRssFeed();
  
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml',
    },
  });
}
