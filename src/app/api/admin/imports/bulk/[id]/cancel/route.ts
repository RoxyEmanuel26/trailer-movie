import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportBatchService } from '@/lib/services/ImportBatchService';

export const POST = apiHandler(async (_request: Request, { params }: any) => {
  await requireAdmin('write:imports');
  const batch = await ImportBatchService.cancel((await params).id);
  return successResponse({ batch, message: 'Bulk import canceled. Unstarted jobs were moved to the log.' });
});
