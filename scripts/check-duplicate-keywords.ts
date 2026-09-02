import { prisma } from '../src/lib/prisma';

async function run() {
  const keywords = await prisma.keyword.findMany({
    select: { id: true, name: true, tmdbId: true }
  });

  const nameMap = new Map<string, typeof keywords>();
  for (const kw of keywords) {
    const lowerName = kw.name.toLowerCase().trim();
    if (!nameMap.has(lowerName)) {
      nameMap.set(lowerName, []);
    }
    nameMap.get(lowerName)!.push(kw);
  }

  const duplicates = [];
  for (const [name, kws] of nameMap.entries()) {
    if (kws.length > 1) {
      duplicates.push({ name, count: kws.length, ids: kws.map(k => k.id), tmdbIds: kws.map(k => k.tmdbId) });
    }
  }

  console.log('Total keywords:', keywords.length);
  console.log('Duplicate names found:', duplicates.length);
  if (duplicates.length > 0) {
    console.table(duplicates.slice(0, 10)); // Show top 10
  }
}

run().finally(() => prisma.$disconnect());
