import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MovieService } from '@/lib/services/MovieService';
import { enforceRateLimit, resolveIp } from '@/lib/security/rateLimiter';
import { AppError } from '@/lib/errors';

const deckQuerySchema = z.object({
  mood: z.string().trim().max(40).optional(),
  region: z.string().trim().max(40).optional(),
  streaming: z.string().trim().max(40).optional(),
  maxRuntime: z.coerce.number().int().min(60).max(300).optional(),
  minRating: z.coerce.number().min(0).max(9.5).optional(),
  limit: z.coerce.number().int().min(5).max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(resolveIp(request), 60, '/api/tonight/deck');

    const { searchParams } = request.nextUrl;
    const parsed = deckQuerySchema.safeParse({
      mood: searchParams.get('mood') || undefined,
      region: searchParams.get('region') || undefined,
      streaming: searchParams.get('streaming') || undefined,
      maxRuntime: searchParams.get('maxRuntime') || undefined,
      minRating: searchParams.get('minRating') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const deck = await MovieService.getTonightDeck(parsed.data);
    return NextResponse.json(
      { deck },
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
      { error: 'Failed to load movie deck' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
