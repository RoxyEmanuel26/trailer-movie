import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { requireAdmin } from '@/lib/auth/utils';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const { total, data: activities } = await AnalyticsService.listAdminActivity(skip, limit);

  return NextResponse.json({
    data: activities,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  });
});
