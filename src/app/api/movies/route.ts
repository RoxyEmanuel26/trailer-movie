import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { MovieService } from '@/lib/services/MovieService';

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '50', 10);

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
