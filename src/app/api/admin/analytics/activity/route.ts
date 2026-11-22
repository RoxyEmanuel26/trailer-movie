import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { requireAdmin } from '@/lib/auth/utils';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin('read:analytics');
  const url = new URL(req.url);
  const rawPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const rawLimit = Number.parseInt(url.searchParams.get('limit') || '50', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 10_000) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 100) : 50;
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
