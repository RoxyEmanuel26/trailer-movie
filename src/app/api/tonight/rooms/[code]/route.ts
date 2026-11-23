import { NextRequest, NextResponse } from 'next/server';
import { computeRoomMatches, normalizeRoomCode, TonightRoomStore } from '@/lib/tonight';
import { enforceRateLimit, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    await enforceRateLimit(resolveIp(request), 120, '/api/tonight/rooms/get');

    const { code: rawCode } = await context.params;
    const code = normalizeRoomCode(rawCode || '');
    if (!code) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const room = await TonightRoomStore.get(code);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or expired' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      { room, matches: computeRoomMatches(room) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof AppError) {
      const headers = (error as AppError & { headers?: Record<string, string> }).headers;
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { 'Cache-Control': 'no-store', ...headers } },
      );
    }
    return NextResponse.json(
      { error: 'Failed to load room state' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
