import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const [quality, queue, staleRunning, batches] = await Promise.all([
    prisma.movie.groupBy({
      by: ['status', 'importQualityStatus'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.importJob.groupBy({ by: ['status', 'retryable'], _count: true }),
    prisma.importJob.count({
      where: {
        status: 'IN_PROGRESS',
        OR: [{ lockedUntil: { lt: new Date() } }, { lockedUntil: null }],
      },
    }),
    prisma.importBatch.groupBy({ by: ['status'], _count: true }),
  ]);

  console.log(JSON.stringify({ quality, queue, staleRunning, batches }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
