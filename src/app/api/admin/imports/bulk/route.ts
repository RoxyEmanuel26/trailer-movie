import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportBatchSchema } from '@/lib/api/schemas';
import { ImportBatchService } from '@/lib/services/ImportBatchService';

export const GET = apiHandler(async () => {
  await requireAdmin('read:imports');
  return successResponse({ batches: await ImportBatchService.list() });
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin('write:imports');
  const input = ImportBatchSchema.parse(await request.json());
  const batch = await ImportBatchService.create(input);
  return successResponse({ batch, message: 'Bulk discovery queued' }, 202);
});
