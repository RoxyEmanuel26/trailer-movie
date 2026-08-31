const fs = require('fs');
let content = fs.readFileSync('src/lib/services/import-service.ts', 'utf8');

// The exact string to replace is around line 150-160
const target = 
        // 5. Prepare Languages if missing
        const languagesToLink: string[] = [];
        if (tmdbMovie.spoken_languages && tmdbMovie.spoken_languages.length > 0) {
          const existingLangs = await prisma.movieLanguage.count({ where: { movieId: existingMovie.id } });
          if (existingLangs === 0) {
            const sorted = [...tmdbMovie.spoken_languages].sort((a, b) => (a.iso_639_1 || '').localeCompare(b.iso_639_1 || ''));
            for (const lang of sorted) {
              if (!lang.iso_639_1) continue;
              const language = await prisma.language.upsert({
                where: { isoCode: lang.iso_639_1 },
                create: { isoCode: lang.iso_639_1, name: lang.name },
                update: { name: lang.name }
              });
              languagesToLink.push(language.id);
            }
          }
        }
;

const replacement = target + 
        // 6. Prepare People (Crew/Cast) if missing
        const peopleToLink: any[] = [];
        const existingPeople = await prisma.moviePerson.count({ where: { movieId: existingMovie.id } });
        if (existingPeople === 0) {
          try {
            const credits = await getMovieCredits(tmdbId);
            
            // Process Directors, Writers, Producers
            const targetJobs = ['Director', 'Writer', 'Screenplay', 'Producer'];
            const relevantCrew = (credits.crew || []).filter((c: any) => targetJobs.includes(c.job));
            
            // Limit to top 15 cast members to avoid blowing up DB for background patches
            const topCast = (credits.cast || []).slice(0, 15);
            
            const allPeopleToProcess = [...relevantCrew, ...topCast];
            
            // Upsert basic Person records efficiently (without calling getPersonExtra for each)
            for (const p of allPeopleToProcess) {
              let roleType = 'ACTOR';
              if (p.job === 'Director') roleType = 'DIRECTOR';
              else if (p.job === 'Writer' || p.job === 'Screenplay') roleType = 'WRITER';
              else if (p.job === 'Producer') roleType = 'PRODUCER';
              
              const person = await prisma.person.upsert({
                where: { tmdbId: p.id },
                create: {
                  tmdbId: p.id,
                  name: p.name,
                  slug: \\-\\,
                  headshotUrl: p.profile_path ? \https://image.tmdb.org/t/p/w300\\ : null,
                  gender: p.gender,
                  knownForDepartment: p.known_for_department
                },
                update: {
                  name: p.name,
                  headshotUrl: p.profile_path ? \https://image.tmdb.org/t/p/w300\\ : null,
                }
              });
              
              peopleToLink.push({
                personId: person.id,
                roleType,
                characterName: p.character || null,
                sortOrder: p.order || 0
              });
            }
          } catch (err) {
            // If getMovieCredits fails, log it but don't fail the whole patch
            console.error('Failed to fetch credits during patch:', err);
          }
        }
;

content = content.replace(target, replacement);

const targetTx =           // Use raw queries or connect payload to link them
          if (companiesToLink.length > 0) patchData.companies = { create: companiesToLink.map(id => ({ companyId: id })) };
          if (keywordsToLink.length > 0) patchData.keywords = { create: keywordsToLink.map(id => ({ keywordId: id })) };
          if (countriesToLink.length > 0) patchData.countries = { create: countriesToLink.map(id => ({ countryId: id })) };
          if (languagesToLink.length > 0) patchData.languages = { create: languagesToLink.map(id => ({ languageId: id })) };;
          
const replacementTx = targetTx + 
          if (peopleToLink.length > 0) patchData.people = { create: peopleToLink };;

content = content.replace(targetTx, replacementTx);
fs.writeFileSync('src/lib/services/import-service.ts', content);
console.log('Patched import-service.ts');
