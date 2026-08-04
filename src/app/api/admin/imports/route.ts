import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { ImportSchema } from '@/lib/api/schemas';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportManagerService } from '@/lib/services/ImportManagerService';
import { ImportJobStatus } from '@prisma/client';

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:imports");
  
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || "50", 10);
  const status = searchParams.get("status") as ImportJobStatus | undefined;

  const result = await ImportManagerService.listJobs({ skip, take, status });
  return successResponse(result);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:imports");
  
  const body = await request.json();
  const input = ImportSchema.parse(body);

  const job = await ImportManagerService.enqueueMovieImport(input.tmdbId);

  return successResponse({ job, message: "Import queued" }, 202);
});
