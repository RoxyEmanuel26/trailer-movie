import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeRoomCode, TonightRoomStore } from '@/lib/tonight';
import { enforceRateLimit, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';

const swipeSchema = z.object({
  role: z.enum(['host', 'guest']),
  movieId: z.string().trim().min(1).max(64),
  decision: z.enum(['like', 'pass']),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    await enforceRateLimit(resolveIp(request), 120, '/api/tonight/rooms/swipe');

    const { code: rawCode } = await context.params;
    const code = normalizeRoomCode(rawCode || '');
    if (!code) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const parsed = swipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid swipe payload' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const updated = await TonightRoomStore.recordSwipe({
      code,
      role: parsed.data.role,
      movieId: parsed.data.movieId,
      decision: parsed.data.decision,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Room not found or expired' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(updated, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AppError) {
      const headers = (error as AppError & { headers?: Record<string, string> }).headers;
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { 'Cache-Control': 'no-store', ...headers } },
      );
    }
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
