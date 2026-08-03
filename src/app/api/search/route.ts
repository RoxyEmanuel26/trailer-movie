import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { SearchSchema } from '@/lib/api/schemas';
import { SearchService } from '@/lib/services/SearchService';

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Zod validation parses and typecasts the inputs
  const input = SearchSchema.parse({
    query: searchParams.get('query') || '',
    page: searchParams.get('page') || 1,
  });

  const results = await SearchService.searchExternal(input.query, input.page);

  return successResponse(results);
});
