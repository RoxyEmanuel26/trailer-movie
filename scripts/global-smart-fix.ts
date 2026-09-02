import { prisma } from '../src/lib/prisma';

async function globalFix() {
  console.log('Scanning ENTIRE database (4000+ movies) for missing or incorrect countries/languages...');
  
  // Fetch ALL movies regardless of aiEnrichmentStatus
  const movies = await prisma.movie.findMany({
    include: {
      countries: { include: { country: true } },
      languages: { include: { language: true } },
    }
  });

  let fixedCount = 0;

  for (const m of movies) {
    let targetLang: { code: string; name: string } | null = null;
    let targetCountry: { code: string; name: string } | null = null;

    // Smart Detection based on title alphabet
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
    } else if (/^[a-zA-Z\s\.,!\?'-]+$/.test(m.title)) {
      // It's purely English/Latin alphabet. 
      // If it has NO languages at all, we safely assume English 'en' and US 'US'.
      if (m.languages.length === 0 && m.countries.length === 0) {
        targetLang = { code: 'en', name: 'English' };
        targetCountry = { code: 'US', name: 'United States' };
      }
    }

    if (targetLang && targetCountry) {
      const hasUS = m.countries.some(c => c.country.isoCode === 'US');
      const hasEnglish = m.languages.some(l => l.language.isoCode === 'en');
      const missingCountry = m.countries.length === 0;
      const missingLang = m.languages.length === 0;
      const hasWrongLang = !m.languages.some(l => l.language.isoCode === targetLang?.code);
      const hasWrongCountry = !m.countries.some(c => c.country.isoCode === targetCountry?.code);

      // We only remove US/en IF the title is purely foreign (Cyrillic, Hangul, etc.)
      const isForeignAlphabet = targetLang.code !== 'en';

      if ((isForeignAlphabet && (hasUS || hasEnglish)) || missingCountry || missingLang || hasWrongLang || hasWrongCountry) {
        
        // Remove wrong US/English assignments for foreign movies
        if (isForeignAlphabet && hasUS) {
          await prisma.movieCountry.deleteMany({ where: { movieId: m.id, country: { isoCode: 'US' } } });
        }
        if (isForeignAlphabet && hasEnglish) {
          await prisma.movieLanguage.deleteMany({ where: { movieId: m.id, language: { isoCode: 'en' } } });
        }

        // Ensure target language is linked
        if (hasWrongLang || missingLang) {
          let lang = await prisma.language.findFirst({ where: { isoCode: { equals: targetLang.code, mode: 'insensitive' } } });
          if (!lang) lang = await prisma.language.create({ data: { isoCode: targetLang.code, name: targetLang.name, source: 'SYSTEM_FIX' } });
          await prisma.movieLanguage.upsert({
            where: { movieId_languageId: { movieId: m.id, languageId: lang.id } },
            create: { movieId: m.id, languageId: lang.id },
            update: {}
          });
        }

        // Ensure target country is linked
        if (hasWrongCountry || missingCountry) {
          let country = await prisma.country.findFirst({ where: { isoCode: { equals: targetCountry.code, mode: 'insensitive' } } });
          if (!country) country = await prisma.country.create({ data: { isoCode: targetCountry.code, name: targetCountry.name, source: 'SYSTEM_FIX' } });
          await prisma.movieCountry.upsert({
            where: { movieId_countryId: { movieId: m.id, countryId: country.id } },
            create: { movieId: m.id, countryId: country.id },
            update: {}
          });
        }

        // Protect fields
        let lockedFields = (m.lockedFields as string[]) || [];
        if (!lockedFields.includes('languages')) lockedFields.push('languages');
        if (!lockedFields.includes('countries')) lockedFields.push('countries');
        
        await prisma.movie.update({
          where: { id: m.id },
          data: { lockedFields }
        });

        fixedCount++;
        console.log(`[FIXED] ${m.title} -> ${targetCountry.name} / ${targetLang.name}`);
      }
    }
  }
  console.log(`\nGlobal scan complete. Successfully auto-fixed ${fixedCount} movies across the ENTIRE database.`);
}

globalFix().catch(console.error).finally(() => prisma.$disconnect());
