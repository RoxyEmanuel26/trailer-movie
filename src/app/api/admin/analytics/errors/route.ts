import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { ErrorLogService } from '@/lib/services/ErrorLogService';
import { requireAdmin } from '@/lib/auth/utils';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const [errors, stats] = await Promise.all([
    ErrorLogService.getRecentErrors(100),
    ErrorLogService.getErrorStats()
  ]);

  return NextResponse.json({
    errors,
    stats,
  });
});
