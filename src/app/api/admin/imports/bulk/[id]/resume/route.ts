import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportBatchService } from '@/lib/services/ImportBatchService';

export const POST = apiHandler(async (_request: Request, { params }: any) => {
  await requireAdmin('write:imports');
  return successResponse({ batch: await ImportBatchService.resume((await params).id) });
});
