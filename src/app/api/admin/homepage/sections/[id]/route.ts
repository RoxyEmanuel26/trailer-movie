import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { HomepageService } from '@/lib/services/HomepageService';
import { HomepageSectionInputSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const PUT = apiHandler(async (req: NextRequest, params: any) => {
  await requireAdmin("update:movies");
  const { id } = await params;
  const body = await req.json();
  const data = HomepageSectionInputSchema.parse(body);
  const section = await HomepageService.updateSection(id, data);
  return successResponse(section);
});

export const DELETE = apiHandler(async (req: NextRequest, params: any) => {
  await requireAdmin("update:movies");
  const { id } = await params;
  await HomepageService.deleteSection(id);
  return successResponse({ success: true });
});
