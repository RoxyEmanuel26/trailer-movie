import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MovieService } from '@/lib/services/MovieService';
import { TonightRoomStore } from '@/lib/tonight';
import { enforceRateLimit, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';
import { absoluteUrl } from '@/lib/site-config';

const createRoomSchema = z.object({
  mood: z.string().trim().max(40).optional(),
  region: z.string().trim().max(40).optional(),
  streaming: z.string().trim().max(40).optional(),
  maxRuntime: z.coerce.number().int().min(60).max(300).optional(),
  minRating: z.coerce.number().min(0).max(9.5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(resolveIp(request), 20, '/api/tonight/rooms');

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text.trim()) body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid room filter options' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    let deck = await MovieService.getTonightDeck({ ...parsed.data, limit: 15 });
    if (deck.length === 0) {
      deck = await MovieService.getTonightDeck({ limit: 15 });
    }
    if (deck.length === 0) {
      return NextResponse.json(
        { error: 'No movies available to build a room deck right now' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const room = await TonightRoomStore.create(deck);
    return NextResponse.json(
      {
        code: room.code,
        shareUrl: absoluteUrl(`/tonight?room=${room.code}`),
        room,
        matches: [],
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
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
      { error: 'Failed to create movie night room' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
