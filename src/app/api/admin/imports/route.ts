import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { ImportListSchema, ImportSchema } from '@/lib/api/schemas';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportManagerService } from '@/lib/services/ImportManagerService';

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const input = ImportListSchema.parse(Object.fromEntries(searchParams.entries()));
  const result = await ImportManagerService.listJobs(input);
  return successResponse(result);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:imports");
  
  const body = await request.json();
  const input = ImportSchema.parse(body);

  const job = await ImportManagerService.enqueueMovieImport(input.tmdbId, input.forceRefresh);

  return successResponse({ job, message: "Import queued" }, 202);
});
