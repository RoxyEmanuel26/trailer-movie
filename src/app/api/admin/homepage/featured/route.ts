import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { HomepageService } from '@/lib/services/HomepageService';
import { FeaturedItemInputSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const GET = apiHandler(async () => {
  await requireAdmin("update:movies");
  const items = await HomepageService.listFeaturedItems();
  return successResponse(items);
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin("update:movies");
  const body = await req.json();
  const data = FeaturedItemInputSchema.parse(body);
  const item = await HomepageService.addFeaturedItem(data);
  return successResponse(item);
});
