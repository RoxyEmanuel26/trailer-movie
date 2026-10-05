import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { MovieService } from '@/lib/services/MovieService';
import { z } from 'zod';

const listQuery = z.object({
  skip: z.coerce.number().int().min(0).max(50_000).default(0),
  take: z.coerce.number().int().min(1).max(50).default(50),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { skip, take } = listQuery.parse({
    skip: searchParams.get('skip') || undefined,
    take: searchParams.get('take') || undefined,
  });

  // Authentication/Authorization would have happened in middleware
  const movies = await MovieService.listMovies({ skip, take });

  return successResponse(movies);
});

// Example placeholder for POST /api/movies (manual creation)
export const POST = apiHandler(async (request: NextRequest) => {
  // Validation would happen here
  // const body = await request.json();
  // const data = MovieUpdateSchema.parse(body);

  return successResponse({ message: 'Not implemented yet' }, 201);
});
