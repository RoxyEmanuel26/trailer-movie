import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { SettingUpdateSchema } from '@/lib/api/schemas';

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const data = SettingUpdateSchema.parse(body);

  // Controller -> Service boundary
  // const result = await SettingService.updateSetting(data);

  return successResponse({ updated: data }, 200);
});
