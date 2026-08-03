import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { ImportSchema } from '@/lib/api/schemas';
import { requireAdmin } from '@/lib/auth/utils';
import { queue } from '@/lib/jobs/queue';

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:imports");
  
  const body = await request.json();
  const input = ImportSchema.parse(body);

  const jobId = await queue.enqueue("movie-import", input);

  return successResponse({ jobId, message: "Import queued" }, 202);
});
