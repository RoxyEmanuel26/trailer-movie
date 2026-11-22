import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/utils';
import { ImportRepository } from '@/lib/repositories/ImportRepository';

export const POST = apiHandler(async () => {
  await requireAdmin('write:imports');
  const result = await ImportRepository.enqueueNewlyReleasedDrafts({
    limit: 500,
    staleHours: 24,
    lookbackDays: 365,
  });

  const message =
    result.queued > 0
      ? `Queued ${result.queued} newly released draft movie(s) for TMDB refresh.`
      : 'No newly released draft movies need refreshing right now.';

  return successResponse({
    ...result,
    message,
  });
});
