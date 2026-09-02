import { prisma } from '../src/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function searchContext(title: string, releaseDate?: Date | null): Promise<string> {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const query = `"${title}" ${year} movie`.trim();
  
  // 1. Try Tavily if available
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: process.env.TAVILY_API_KEY, 
          query: `${query} synopsis details`, 
          search_depth: 'basic' 
        })
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 5).map((r: any) => `Result: ${r.title}\n${r.content}\n`).join('\n').trim();
      }
    } catch(e) {
      console.error(`Tavily search failed for "${title}":`, e);
    }
  }

  // 2. Try Serper if available
  if (process.env.SERPER_API_KEY) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 
          'X-API-KEY': process.env.SERPER_API_KEY, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ q: `${query} synopsis production company imdb` })
      });
      const data = await res.json();
      if (data.organic && data.organic.length > 0) {
        return data.organic.slice(0, 5).map((r: any) => `Result: ${r.title}\n${r.snippet}\n`).join('\n').trim();
      }
    } catch(e) {
      console.error(`Serper search failed for "${title}":`, e);
    }
  }

  // 3. Fallback to Wikipedia (free, unblockable, but often lacks indie movies)
  try {
    const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=3`;
    const res = await fetch(wpUrl);
    const data = await res.json();
    
    let context = '';
    if (data?.query?.search && data.query.search.length > 0) {
      for (const r of data.query.search) {
        const cleanSnippet = r.snippet.replace(/<\/?[^>]+(>|$)/g, "");
        context += `Result: ${r.title}\n${cleanSnippet}\n\n`;
      }
      return context.trim();
    }
  } catch (e) {
    console.error(`Wikipedia search failed for "${title}":`, e);
  }

  return '';
}

async function processMovie(movie: any) {
  console.log(`\n-----------------------------------`);
  console.log(`[PROCESS] Movie: ${movie.title} (${movie.id})`);
  
  await prisma.movie.update({
    where: { id: movie.id },
    data: {
      aiEnrichmentStatus: 'PROCESSING',
      aiEnrichmentAttemptedAt: new Date(),
    }
  });

  const context = await searchContext(movie.title, movie.releaseDate);
  const searchSection = context 
    ? `\nSearch Context:\n${context}` 
    : `\nSearch Context:\nNone available. Please rely strictly on your internal knowledge base if you are highly confident, otherwise return null.`;

  const systemPrompt = `You are an expert movie metadata extractor. 
You will be given a movie title and some search result snippets about it.
Your task is to extract missing metadata and return it strictly in JSON format.

CRITICAL RULES:
1. For 'synopsis', 'keywords', and 'production_companies': If you are unsure or data is missing, return null/empty.
2. For 'countries' and 'languages': IF SEARCH CONTEXT IS EMPTY, YOU MUST DEDUCE THEM FROM THE TITLE'S ALPHABET/LANGUAGE:
   - Cyrillic titles (e.g. "Собачья будка") MUST return Russia ('RU') and Russian ('ru').
   - Hangul titles MUST return South Korea ('KR') and Korean ('ko').
   - Kanji/Kana titles MUST return Japan ('JP') and Japanese ('ja').
   - Hanzi titles MUST return China ('CN') and Mandarin ('zh').
   - English titles MUST default to English ('en') and United States ('US') or UK ('GB').
   Never leave 'languages' or 'countries' empty if the alphabet makes it obvious. Ensure they always match logically.

Return JSON format strictly:
{
  "synopsis": "A 2-3 sentence plot summary (string) or null",
  "keywords": ["tag1", "tag2"] or [],
  "production_companies": ["company name"] or [],
  "countries": [{"isoCode": "US", "name": "United States"}] or [],
  "languages": [{"isoCode": "en", "name": "English"}] or []
}
Use ISO 3166-1 alpha-2 for country codes.
Use ISO 639-1 for language codes.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Title: ${movie.title}\nYear: ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Unknown'}${searchSection}` }
      ],
      response_format: { type: 'json_object' }
    });

    const rawJson = response.choices[0].message.content || '{}';
    const data = JSON.parse(rawJson);
    console.log(`[AI RESULT]`, data);

    let isEnriched = false;
    let lockedFields = (movie.lockedFields as string[]) || [];

    if (data.synopsis && typeof data.synopsis === 'string' && data.synopsis.length > 20) {
      if (!lockedFields.includes('synopsis')) lockedFields.push('synopsis');
      await prisma.movie.update({
        where: { id: movie.id },
        data: {
          synopsis: data.synopsis,
          synopsisSource: 'AI_ENRICHED'
        }
      });
      isEnriched = true;
      console.log(`- Updated Synopsis`);
    }

    if (Array.isArray(data.keywords) && data.keywords.length > 0) {
      let kwEnriched = false;
      for (const kw of data.keywords) {
        if (typeof kw !== 'string') continue;
        const kwName = kw.trim();
        let keyword = await prisma.keyword.findFirst({ 
          where: { name: { equals: kwName, mode: 'insensitive' } } 
        });
        if (!keyword) {
          keyword = await prisma.keyword.create({
            data: { name: kwName.toLowerCase(), source: 'AI_ENRICHED' }
          });
        }
        const exists = await prisma.movieKeyword.findUnique({
          where: { movieId_keywordId: { movieId: movie.id, keywordId: keyword.id } }
        });
        if (!exists) {
          await prisma.movieKeyword.create({
            data: { movieId: movie.id, keywordId: keyword.id }
          });
          kwEnriched = true;
          isEnriched = true;
        }
      }
      if (kwEnriched && !lockedFields.includes('keywords')) lockedFields.push('keywords');
      console.log(`- Updated ${data.keywords.length} Keywords`);
    }

    if (Array.isArray(data.production_companies) && data.production_companies.length > 0) {
      let pcEnriched = false;
      for (const cName of data.production_companies) {
        if (typeof cName !== 'string') continue;
        let company = await prisma.productionCompany.findFirst({ 
          where: { name: { equals: cName.trim(), mode: 'insensitive' } } 
        });
        if (!company) {
          // Slugify function simplified for local creation
          const makeSlug = (text: string) => text.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '');
          const slug = makeSlug(cName);
          // Just in case slug already exists from a different name spelling
          let existingSlug = await prisma.productionCompany.findUnique({ where: { slug } });
          if (existingSlug) {
            company = existingSlug;
          } else {
            company = await prisma.productionCompany.create({
              data: { name: cName.trim(), slug, source: 'AI_ENRICHED' }
            });
          }
        }
        const exists = await prisma.movieCompany.findUnique({
          where: { movieId_companyId: { movieId: movie.id, companyId: company.id } }
        });
        if (!exists) {
          await prisma.movieCompany.create({
            data: { movieId: movie.id, companyId: company.id }
          });
          pcEnriched = true;
          isEnriched = true;
        }
      }
      if (pcEnriched && !lockedFields.includes('production_companies')) lockedFields.push('production_companies');
      console.log(`- Updated ${data.production_companies.length} Companies`);
    }

    if (Array.isArray(data.countries)) {
      let countryEnriched = false;
      for (const c of data.countries) {
        if (!c.isoCode || !c.name) continue;
        const iso = c.isoCode.toUpperCase();
        let country = await prisma.country.findFirst({ 
          where: { isoCode: { equals: iso, mode: 'insensitive' } } 
        });
        if (!country) {
          country = await prisma.country.create({
            data: { isoCode: iso, name: c.name, source: 'AI_ENRICHED' }
          });
        }
        const exists = await prisma.movieCountry.findUnique({
          where: { movieId_countryId: { movieId: movie.id, countryId: country.id } }
        });
        if (!exists) {
          await prisma.movieCountry.create({
            data: { movieId: movie.id, countryId: country.id }
          });
          countryEnriched = true;
          isEnriched = true;
        }
      }
      if (countryEnriched && !lockedFields.includes('countries')) lockedFields.push('countries');
    }

    if (Array.isArray(data.languages)) {
      let langEnriched = false;
      for (const l of data.languages) {
        if (!l.isoCode || !l.name) continue;
        const iso = l.isoCode.toLowerCase();
        let lang = await prisma.language.findFirst({ 
          where: { isoCode: { equals: iso, mode: 'insensitive' } } 
        });
        if (!lang) {
          lang = await prisma.language.create({
            data: { isoCode: iso, name: l.name, source: 'AI_ENRICHED' }
          });
        }
        const exists = await prisma.movieLanguage.findUnique({
          where: { movieId_languageId: { movieId: movie.id, languageId: lang.id } }
        });
        if (!exists) {
          await prisma.movieLanguage.create({
            data: { movieId: movie.id, languageId: lang.id }
          });
          langEnriched = true;
          isEnriched = true;
        }
      }
      if (langEnriched && !lockedFields.includes('languages')) lockedFields.push('languages');
    }

    // Save all locked fields and status
    await prisma.movie.update({
      where: { id: movie.id },
      data: {
        aiEnrichmentStatus: isEnriched ? 'COMPLETED' : 'NOT_FOUND',
        lockedFields: lockedFields,
      }
    });

  } catch (err: any) {
    console.error(`[AI ERROR]`, err.message);
    await prisma.movie.update({
      where: { id: movie.id },
      data: { aiEnrichmentStatus: 'FAILED' }
    });
  }
}

async function runBatch() {
  const args = process.argv.slice(2);
  let LIMIT: number | undefined;
  
  if (args[0] && args[0].toLowerCase() === 'all') {
    LIMIT = undefined;
  } else {
    const limitArg = args[0] ? parseInt(args[0], 10) : 5;
    LIMIT = isNaN(limitArg) ? 5 : limitArg;
  }

  const limitText = LIMIT === undefined ? 'ALL' : LIMIT.toString();
  console.log(`Starting AI Enrichment Batch Job... (Limit: ${limitText} movies)`);
  
  if (!process.env.TAVILY_API_KEY && !process.env.SERPER_API_KEY) {
    console.warn('⚠️ WARNING: Neither TAVILY_API_KEY nor SERPER_API_KEY is set in .env.');
    console.warn('⚠️ The script will fallback to Wikipedia search which is highly limited for obscure indie movies.');
    console.warn('⚠️ Please add a search API key to improve context for DeepSeek.');
  }

  const movies = await prisma.movie.findMany({
    where: {
      aiEnrichmentStatus: 'PENDING',
      OR: [
        { synopsis: null },
        { synopsis: '' },
        { companies: { none: {} } },
        { keywords: { none: {} } },
      ]
    },
    take: LIMIT,
  });

  if (movies.length === 0) {
    console.log('No pending movies missing data. Job done.');
    return;
  }

  for (const movie of movies) {
    await processMovie(movie);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\\nBatch complete.');
}

runBatch().catch(console.error).finally(() => prisma.$disconnect());
