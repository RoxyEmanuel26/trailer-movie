
import { prisma } from '../src/lib/prisma';
async function test() {
  const ids = [
    'cmt3flsu407j04kvds506aulw', // Carola!
    'cmt3fltg707j64kvdq6t98u6n', // I Never Wanted to be Horny
    'cmt3fluo407jd4kvdni717raj', // More Lovely
    'cmt3fm2s007jp4kvd0282w5gy', // A Mother's Secret
    'cmt3fm34z07ju4kvd51hmyfuo'  // CLONING GUM
  ];
  const movies = await prisma.movie.findMany({
    where: { id: { in: ids } },
    include: {
      keywords: { include: { keyword: true } },
      countries: { include: { country: true } },
      languages: { include: { language: true } },
      companies: { include: { company: true } }
    }
  });
  
  for (const m of movies) {
    console.log('Title:', m.title);
    console.log('Synopsis:', m.synopsis);
    console.log('Keywords:', m.keywords.map(k => k.keyword.name).join(', '));
    console.log('Companies:', m.companies.map(c => c.company.name).join(', '));
    console.log('Countries:', m.countries.map(c => c.country.name).join(', '));
    console.log('Languages:', m.languages.map(l => l.language.name).join(', '));
    console.log('-----------------------------------');
  }
}
test().finally(() => prisma.$disconnect());

