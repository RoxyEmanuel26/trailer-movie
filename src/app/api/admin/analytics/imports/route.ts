import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { ImportMetricsService } from '@/lib/services/ImportMetricsService';
import { requireAdmin } from '@/lib/auth/utils';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const data = await ImportMetricsService.getImportOverview();
  return NextResponse.json(data);
});
