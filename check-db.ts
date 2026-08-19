import { prisma } from './src/lib/prisma';
async function main() {
  console.log('Movies:', await prisma.movie.count());
  console.log('Pending Jobs:', await prisma.importJob.count({ where: { status: 'PENDING' } }));
  console.log('In Progress Jobs:', await prisma.importJob.count({ where: { status: 'IN_PROGRESS' } }));
  console.log('Completed Jobs:', await prisma.importJob.count({ where: { status: 'COMPLETED' } }));
}
main().catch(console.error).finally(() => prisma.$disconnect());
