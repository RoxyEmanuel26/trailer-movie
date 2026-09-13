import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportBatchService } from '@/lib/services/ImportBatchService';
import { NotFoundError } from '@/lib/errors';

export const GET = apiHandler(async (_request: Request, { params }: any) => {
  await requireAdmin('read:imports');
  const batch = await ImportBatchService.find((await params).id);
  if (!batch) throw new NotFoundError('Import batch not found');
  return successResponse({ batch });
});
