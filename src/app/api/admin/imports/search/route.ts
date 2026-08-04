import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { searchMovies } from '@/lib/tmdb/api';
import { ValidationError } from '@/lib/errors';

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:imports");
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  
  if (!query) {
    throw new ValidationError("Search query is required");
  }

  const results = await searchMovies(query);
  
  return successResponse({ results: results.results });
});
