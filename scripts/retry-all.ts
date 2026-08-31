import { prisma } from '../src/lib/prisma';
async function run() {
  try {
    const result = await prisma.importJob.updateMany({
      where: { status: 'FAILED' },
      data: { status: 'PENDING', logs: 'Resetting failed job for retry... \n' }
    });
    console.log('Reset ' + result.count + ' FAILED jobs to PENDING');
  } finally {
    await prisma.$disconnect();
  }
}
run();
