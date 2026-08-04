import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { HomepageService } from '@/lib/services/HomepageService';
import { ReorderSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireAdmin("update:movies");
  const body = await req.json();
  const { orderedIds } = ReorderSchema.parse(body);
  await HomepageService.reorderFeaturedItems(orderedIds);
  return successResponse({ success: true });
});
