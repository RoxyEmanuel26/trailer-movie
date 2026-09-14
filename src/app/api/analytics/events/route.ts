import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EventTrackingService } from '@/lib/services/EventTrackingService';

const eventSchema = z.object({
  eventName: z.enum(['page_view', 'movie_view', 'person_view', 'trailer_play', 'trailer_complete', 'search', 'filter_apply', 'pagination', 'homepage_click', 'web_vital', 'system_error', 'security_alert']),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    const { eventName, entityId, metadata } = parsed.data;

    switch (eventName) {
      case 'page_view':
        await EventTrackingService.trackPageView((metadata?.path as string) || '/');
        break;
      case 'movie_view':
        if (entityId) await EventTrackingService.trackMovieView(entityId);
        break;
      case 'trailer_play':
        if (entityId) await EventTrackingService.trackTrailerPlay(entityId, (metadata?.trailerId as string) || '');
        break;
      case 'search':
        await EventTrackingService.trackSearch(sanitizeSearchQuery((metadata?.query as string) || ''), (metadata?.resultsCount as number) || 0);
        break;
      default:
        await EventTrackingService.trackGeneric(eventName, entityId, metadata as any);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function sanitizeSearchQuery(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
