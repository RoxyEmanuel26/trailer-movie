import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EventTrackingService } from '@/lib/services/EventTrackingService';

const eventSchema = z.object({
  eventName: z.enum(['page_view', 'movie_view', 'trailer_play', 'trailer_complete', 'search', 'homepage_click', 'system_error', 'security_alert']),
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
        await EventTrackingService.trackSearch((metadata?.query as string) || '', (metadata?.resultsCount as number) || 0);
        break;
      // Additional events can be handled directly via a generic method if needed
      default:
        // Or directly log via repository
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
