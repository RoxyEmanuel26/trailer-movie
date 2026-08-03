import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { ImportSchema } from '@/lib/api/schemas';
import { SyncService } from '@/lib/services/import-service';

export const POST = apiHandler(async (request: NextRequest) => {
  // 1. Authentication & Authorization is handled by Next.js middleware matching /api/admin/*

  // 2. Validation
  const body = await request.json();
  const input = ImportSchema.parse(body);

  // 3. Controller -> Service invocation
  const result = await SyncService.importMovie(input.tmdbId);

  // 4. Standard Response Envelope
  return successResponse({ movie: result }, 201);
});
