import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { SeoService } from '@/lib/services/SeoService';
import { SeoUpdateSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const GET = apiHandler(async () => {
  await requireAdmin("update:movies");
  const seo = await SeoService.getHomepageSeo();
  return successResponse(seo);
});

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireAdmin("update:movies");
  const body = await req.json();
  const data = SeoUpdateSchema.parse(body);
  const seo = await SeoService.updateHomepageSeo(data);
  return successResponse(seo);
});
