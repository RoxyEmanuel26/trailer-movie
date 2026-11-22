import { NextRequest, NextResponse } from 'next/server';
import { EventTrackingService } from '@/lib/services/EventTrackingService';
import { ANALYTICS_CONSENT_COOKIE, ANALYTICS_ID_COOKIE } from '@/lib/analytics/consent';
import { isLikelyBot } from '@/lib/analytics/server';
import {
  analyticsEventSchema,
  isAllowedAnalyticsOrigin,
  sanitizeAnalyticsSearchQuery,
} from '@/lib/analytics/validation';
import { enforceRateLimit, RateLimitTiers, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    if (req.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value !== 'granted') {
      return new NextResponse(null, { status: 204 });
    }
    const anonymousId = req.cookies.get(ANALYTICS_ID_COOKIE)?.value;
    if (!anonymousId) return new NextResponse(null, { status: 204 });

    const userAgent = req.headers.get('user-agent') || '';
    if (isLikelyBot(userAgent)) return new NextResponse(null, { status: 204 });

    const origin = req.headers.get('origin');
    if (!isAllowedAnalyticsOrigin(origin, req.nextUrl.origin)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    await enforceRateLimit(resolveIp(req), RateLimitTiers.ANALYTICS, '/api/analytics/events');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = analyticsEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    const payload = parsed.data;

    switch (payload.eventName) {
      case 'page_view':
        if (!(await EventTrackingService.trackPageView(payload.metadata?.path || '/'))) {
          return NextResponse.json(
            { error: 'Analytics temporarily unavailable' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
          );
        }
        break;
      case 'movie_view':
        await EventTrackingService.trackMovieView(payload.entityId, anonymousId);
        break;
      case 'trailer_play':
        await EventTrackingService.trackTrailerPlay(
          payload.entityId,
          payload.metadata?.trailerId || '',
          anonymousId,
        );
        break;
      case 'search':
        await EventTrackingService.trackSearch(
          sanitizeAnalyticsSearchQuery(payload.metadata.query),
          payload.metadata.resultsCount,
        );
        break;
      default:
        await EventTrackingService.trackGeneric(
          payload.eventName,
          payload.entityId,
          payload.metadata as Record<string, any> | undefined,
        );
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      const response = NextResponse.json({ error: error.message }, { status: error.statusCode });
      const extraHeaders = (error as AppError & { headers?: Record<string, string> }).headers;
      if (extraHeaders) {
        for (const [key, value] of Object.entries(extraHeaders)) {
          response.headers.set(key, value);
        }
      }
      return response;
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
