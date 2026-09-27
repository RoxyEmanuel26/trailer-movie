import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { searchMovies } from '@/lib/tmdb/api';
import { ValidationError } from '@/lib/errors';
import { isLocalImportMode } from '@/lib/jobs/execution-mode';

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:imports");
  if (isLocalImportMode()) {
    return Response.json({ error: 'TMDB search is available only in the local import process' }, { status: 409 });
  }
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  
  if (!query) {
    throw new ValidationError("Search query is required");
  }

  const results = await searchMovies(query);
  
  return successResponse({ results: results.results });
});
