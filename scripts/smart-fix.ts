import { prisma } from '../src/lib/prisma';

async function runFix() {
  console.log('Scanning database for AI mistakes...');
  
  const movies = await prisma.movie.findMany({
    where: { aiEnrichmentAttemptedAt: { not: null } },
    include: {
      countries: { include: { country: true } },
      languages: { include: { language: true } },
    }
  });

  let fixedCount = 0;

  for (const m of movies) {
    let targetLang: { code: string; name: string } | null = null;
    let targetCountry: { code: string; name: string } | null = null;

    if (/[А-Яа-яЁё]/.test(m.title)) {
      targetLang = { code: 'ru', name: 'Russian' };
      targetCountry = { code: 'RU', name: 'Russia' };
    } else if (/[\uAC00-\uD7AF]/.test(m.title)) {
      targetLang = { code: 'ko', name: 'Korean' };
      targetCountry = { code: 'KR', name: 'South Korea' };
    } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(m.title)) {
      targetLang = { code: 'ja', name: 'Japanese' };
      targetCountry = { code: 'JP', name: 'Japan' };
    } else if (/[\u4E00-\u9FAF]/.test(m.title) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(m.title)) {
      targetLang = { code: 'zh', name: 'Mandarin' };
      targetCountry = { code: 'CN', name: 'China' };
    }

    if (targetLang && targetCountry) {
      const hasUS = m.countries.some(c => c.country.isoCode === 'US');
      const hasEnglish = m.languages.some(l => l.language.isoCode === 'en');
      const missingCountry = m.countries.length === 0;
      const missingLang = m.languages.length === 0;
      const hasWrongLang = !m.languages.some(l => l.language.isoCode === targetLang?.code);

      if (hasUS || hasEnglish || missingCountry || missingLang || hasWrongLang) {
        console.log(`Fixing: ${m.title} (ID: ${m.id})`);
        
        // Remove wrong US/English assignments
        if (hasUS) {
          await prisma.movieCountry.deleteMany({ where: { movieId: m.id, country: { isoCode: 'US' } } });
        }
        if (hasEnglish) {
          await prisma.movieLanguage.deleteMany({ where: { movieId: m.id, language: { isoCode: 'en' } } });
        }

        // Add correct language
        let lang = await prisma.language.findFirst({ where: { isoCode: { equals: targetLang.code, mode: 'insensitive' } } });
        if (!lang) lang = await prisma.language.create({ data: { isoCode: targetLang.code, name: targetLang.name, source: 'AI_ENRICHED' } });
        await prisma.movieLanguage.upsert({
          where: { movieId_languageId: { movieId: m.id, languageId: lang.id } },
          create: { movieId: m.id, languageId: lang.id },
          update: {}
        });

        // Add correct country
        let country = await prisma.country.findFirst({ where: { isoCode: { equals: targetCountry.code, mode: 'insensitive' } } });
        if (!country) country = await prisma.country.create({ data: { isoCode: targetCountry.code, name: targetCountry.name, source: 'AI_ENRICHED' } });
        await prisma.movieCountry.upsert({
          where: { movieId_countryId: { movieId: m.id, countryId: country.id } },
          create: { movieId: m.id, countryId: country.id },
          update: {}
        });

        let lockedFields = (m.lockedFields as string[]) || [];
        if (!lockedFields.includes('languages')) lockedFields.push('languages');
        if (!lockedFields.includes('countries')) lockedFields.push('countries');
        
        await prisma.movie.update({
          where: { id: m.id },
          data: { lockedFields, aiEnrichmentStatus: 'COMPLETED' }
        });

        fixedCount++;
      }
    }
  }
  console.log(`\nScan complete. Successfully auto-fixed ${fixedCount} movies using structural alphabet detection.`);
}

runFix().catch(console.error).finally(() => prisma.$disconnect());
