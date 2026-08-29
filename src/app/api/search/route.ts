import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { SearchSchema } from '@/lib/api/schemas';
import { MovieService } from '@/lib/services/MovieService';

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Zod validation parses and typecasts the inputs
  const input = SearchSchema.parse({
    query: searchParams.get('query') || '',
    page: searchParams.get('page') || 1,
  });

  // Read from local database — NOT from TMDB API
  const results = await MovieService.searchMovies({
    search: input.query || undefined,
    skip: (Number(input.page) - 1) * 24,
    take: 24,
  });

  return successResponse(results);
});

