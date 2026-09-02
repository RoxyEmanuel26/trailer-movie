
import { prisma } from '../src/lib/prisma';
async function test() {
  const m = await prisma.movie.findUnique({
    where: { id: 'cmt3flsu407j04kvds506aulw' },
    include: {
      keywords: { include: { keyword: true } },
      countries: { include: { country: true } },
      languages: { include: { language: true } },
      companies: { include: { company: true } }
    }
  });
  console.log(JSON.stringify(m, null, 2));
}
test().finally(() => prisma.$disconnect());

