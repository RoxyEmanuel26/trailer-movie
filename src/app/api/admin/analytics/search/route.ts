import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { requireAdmin } from '@/lib/auth/utils';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const data = await AnalyticsService.getSearchAnalytics();
  return NextResponse.json(data);
});
