import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const [total, activities] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    }),
  ]);

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
