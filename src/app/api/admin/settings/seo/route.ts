import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { SeoService } from '@/lib/services/SeoService';
import { requireAdmin } from '@/lib/auth/utils';
import { GlobalSeoSettingsSchema } from '@/lib/api/schemas';

export const GET = apiHandler(async () => {
  await requireAdmin('read:seo');
  const settings = await SeoService.getGlobalSeoSettings();
  return successResponse(settings);
});

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireAdmin('write:seo');
  const body = await req.json();
  const parsed = GlobalSeoSettingsSchema.parse(body);
  const updated = await SeoService.updateGlobalSeoSettings(parsed);
  return successResponse(updated);
});
