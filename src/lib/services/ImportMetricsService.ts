import { prisma } from '../prisma';

export class ImportMetricsService {
  static async getImportOverview() {
    const [queued, running, completed, failed] = await Promise.all([
      prisma.importJob.count({ where: { status: 'PENDING' } }),
      prisma.importJob.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.importJob.count({ where: { status: 'COMPLETED' } }),
      prisma.importJob.count({ where: { status: 'FAILED' } }),
    ]);

    const recentJobs = await prisma.importJob.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return {
      stats: { queued, running, completed, failed },
      recentJobs,
    };
  }
}
