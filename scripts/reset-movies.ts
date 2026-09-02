
import { prisma } from '../src/lib/prisma';
async function test() {
  await prisma.movie.updateMany({
    where: { id: { in: ['cmt3g209j086q4kvd3xsfnx33', 'cmt3g1zzc086n4kvdddyz118n'] } },
    data: { aiEnrichmentStatus: 'PENDING' }
  });
  console.log('Reset 2 movies to PENDING');
}
test().finally(() => prisma.$disconnect());

