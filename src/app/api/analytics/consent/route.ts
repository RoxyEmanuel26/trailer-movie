import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_MAX_AGE,
  ANALYTICS_ID_COOKIE,
} from '@/lib/analytics/consent';

const schema = z.object({ analytics: z.boolean() });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid privacy choice' }, { status: 400 });

  const response = NextResponse.json({ analytics: parsed.data.analytics });
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(ANALYTICS_CONSENT_COOKIE, parsed.data.analytics ? 'granted' : 'denied', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ANALYTICS_CONSENT_MAX_AGE,
  });

  if (parsed.data.analytics) {
    const existingId = request.cookies.get(ANALYTICS_ID_COOKIE)?.value;
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
}
