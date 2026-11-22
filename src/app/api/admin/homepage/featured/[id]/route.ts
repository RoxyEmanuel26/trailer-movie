import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { HomepageService } from '@/lib/services/HomepageService';
import { FeaturedItemInputSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin('update:homepage');
  const { id } = await params;
  const body = await req.json();
  const data = FeaturedItemInputSchema.parse(body);
  const item = await HomepageService.updateFeaturedItem(id, data);
  return successResponse(item);
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin('delete:homepage');
  const { id } = await params;
  await HomepageService.removeFeaturedItem(id);
  return successResponse({ success: true });
});
