import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { requireAdmin } from '@/lib/auth/utils';
import { HomepageService } from '@/lib/services/HomepageService';
import { HomepageSectionInputSchema } from '@/lib/api/schemas';
import { successResponse } from '@/lib/api/response';

export const GET = apiHandler(async () => {
  await requireAdmin('read:homepage');
  const sections = await HomepageService.listSections();
  return successResponse(sections);
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAdmin('write:homepage');
  const body = await req.json();
  const data = HomepageSectionInputSchema.parse(body);
  const section = await HomepageService.createSection(data);
  return successResponse(section);
});
