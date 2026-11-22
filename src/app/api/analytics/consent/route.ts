import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_MAX_AGE,
  ANALYTICS_ID_COOKIE,
} from '@/lib/analytics/consent';
import { isAllowedAnalyticsOrigin } from '@/lib/analytics/validation';
import { enforceRateLimit, RateLimitTiers, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';

const schema = z.object({ analytics: z.boolean() });
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedAnalyticsOrigin(request.headers.get('origin'), request.nextUrl.origin)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    await enforceRateLimit(resolveIp(request), RateLimitTiers.PUBLIC_POST, '/api/analytics/consent');

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid privacy choice' }, { status: 400 });

    const response = NextResponse.json({ analytics: parsed.data.analytics });
    const secure = process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:';
    response.cookies.set(ANALYTICS_CONSENT_COOKIE, parsed.data.analytics ? 'granted' : 'denied', {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: ANALYTICS_CONSENT_MAX_AGE,
    });

    if (parsed.data.analytics) {
      const rawExistingId = request.cookies.get(ANALYTICS_ID_COOKIE)?.value?.trim();
      const existingId = rawExistingId && UUID_PATTERN.test(rawExistingId) ? rawExistingId : null;
      response.cookies.set(ANALYTICS_ID_COOKIE, existingId || randomUUID(), {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: ANALYTICS_CONSENT_MAX_AGE,
      });
    } else {
      response.cookies.delete(ANALYTICS_ID_COOKIE);
    }

    return response;
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
