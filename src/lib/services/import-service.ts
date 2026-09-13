import { getMovieExtra, getMovieCredits, getMovieEnriched } from '../tmdb/api';
import { mapTmdbMovieToPrisma, generateSlug } from '../tmdb/mapping';
import { PersonRoleType, TrailerSource, TrailerType } from '@prisma/client';
import { EnrichmentService } from './enrichment-service';

import { MovieRepository } from '../repositories/MovieRepository';
import { GenreRepository } from '../repositories/GenreRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { TrailerRepository } from '../repositories/TrailerRepository';
import { TransactionManager } from '../repositories/TransactionManager';
import { prisma } from '../prisma';
import { logger } from '../logger';
import { ImportRepository } from '../repositories/ImportRepository';
import { ImportQualityService } from './ImportQualityService';
import { TmdbError } from '../tmdb/errors';

// Helpers to prevent P2002 Unique Constraint errors on concurrent batch imports 
// without relying on try-catch, which breaks SQL transactions in Prisma.
async function safeUpsertKeyword(tx: any, kw: { id: number; name: string }) {
  let word = await tx.keyword.findUnique({ where: { tmdbId: kw.id } });
  if (word) {
    if (word.name !== kw.name) {
      // Check if new name is already taken to avoid Transaction Abort
      const conflict = await tx.keyword.findFirst({ where: { name: { equals: kw.name, mode: 'insensitive' } } });
      if (!conflict) {
        word = await tx.keyword.update({ where: { id: word.id }, data: { name: kw.name } });
      }
    }
    return word;
  }
  
  word = await tx.keyword.findFirst({ where: { name: { equals: kw.name, mode: 'insensitive' } } });
  if (word) {
    if (word.tmdbId !== kw.id) {
      word = await tx.keyword.update({ where: { id: word.id }, data: { tmdbId: kw.id } });
    }
    return word;
  }
  
  // If a race condition happens here, P2002 will safely abort the transaction 
  // and the queue will retry the job later. This is correct behavior.
  return await tx.keyword.create({ data: { name: kw.name, tmdbId: kw.id } });
}

async function safeUpsertCompany(tx: any, pc: { id: number; name: string; logo_path?: string }) {
  const logoUrl = pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null;
  const slug = `${generateSlug(pc.name)}-${pc.id}`;
  
  let comp = await tx.productionCompany.findUnique({ where: { tmdbId: pc.id } });
  if (comp) {
    if (comp.name !== pc.name || comp.logoUrl !== logoUrl) {
      comp = await tx.productionCompany.update({ where: { id: comp.id }, data: { name: pc.name, logoUrl } });
    }
    return comp;
  }
  
  comp = await tx.productionCompany.findFirst({ where: { name: { equals: pc.name, mode: 'insensitive' } } });
  if (comp) {
    if (comp.tmdbId !== pc.id) {
      const conflict = await tx.productionCompany.findUnique({ where: { slug } });
      if (!conflict) {
        comp = await tx.productionCompany.update({ where: { id: comp.id }, data: { tmdbId: pc.id, logoUrl, slug } });
      } else {
        comp = await tx.productionCompany.update({ where: { id: comp.id }, data: { tmdbId: pc.id, logoUrl } });
      }
    }
    return comp;
  }
  
  return await tx.productionCompany.create({ data: { name: pc.name, tmdbId: pc.id, logoUrl, slug } });
}

export class SyncService {
  static async importMovie(tmdbId: number) {
    try {
      const tmdbMovie = await getMovieEnriched(tmdbId);
      const sourceIssues: string[] = [];
      const credits = tmdbMovie.credits;
      const videos = tmdbMovie.videos;
      const hasCredits = Array.isArray(credits?.cast) && Array.isArray(credits?.crew);
      const hasVideos = Array.isArray(videos?.results);
      if (!hasCredits) sourceIssues.push('credits_unavailable');
      if (!hasVideos) sourceIssues.push('videos_unavailable');

      const existingMovie = await MovieRepository.findByTmdbId(tmdbId);
      const usesLegacyQualityGate = Boolean(
        existingMovie && existingMovie.createdAt < new Date('2026-09-14T00:00:00.000Z')
      );

      const lockedFields: string[] = Array.isArray(existingMovie?.lockedFields)
        ? (existingMovie?.lockedFields as string[])
        : [];

      let primaryTrailerId = null;
      if (videos && videos.results) {
        const trailers = videos.results.filter(
          (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
        ).sort((a: any, b: any) => Number(b.official) - Number(a.official));
        if (trailers.length > 0) {
          primaryTrailerId = trailers[0].key;
        }
      }

      const movieData = mapTmdbMovieToPrisma(tmdbMovie, lockedFields);

      // To prevent deadlocks, we upsert standalone dictionaries (Genres, People) OUTSIDE the main transaction.
      // We also sort them by ID to ensure deterministic lock ordering if they are upserted concurrently.
      const dbGenres: { tmdbId: number; id: string }[] = [];
      if (!lockedFields.includes('genres')) {
        const genresList = tmdbMovie.genres || [];
        const sortedTmdbGenres = [...genresList].sort((a, b) => a.id - b.id);
        for (const tmdbGenre of sortedTmdbGenres) {
          const genre = await GenreRepository.upsert(
            tmdbGenre.id,
            { name: tmdbGenre.name, slug: generateSlug(tmdbGenre.name), tmdbId: tmdbGenre.id },
            { name: tmdbGenre.name }
          );
          dbGenres.push({ tmdbId: tmdbGenre.id, id: genre.id });
        }
      }

      const dbPeopleLinks: { personId: string; roleType: PersonRoleType; character: string | null; order: number }[] = [];
      const peopleToEnrich = new Set<number>();
      if (!lockedFields.includes('cast') && hasCredits) {
        const castList = credits?.cast || [];
        const topCast = castList.slice(0, 10).map((c: any) => ({ ...c, mappedRole: PersonRoleType.ACTOR }));
        
        const crewList = credits?.crew || [];
        const directors = crewList.filter((c: any) => c.job === 'Director').slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.DIRECTOR }));
        const writers = crewList.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.WRITER }));
        const producers = crewList.filter((c: any) => c.job === 'Producer').slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.PRODUCER }));
        const composers = crewList.filter((c: any) => ['Original Music Composer', 'Music', 'Composer'].includes(c.job)).slice(0, 2).map((c: any) => ({ ...c, mappedRole: PersonRoleType.COMPOSER }));
        const cinematographers = crewList.filter((c: any) => ['Director of Photography', 'Cinematography'].includes(c.job)).slice(0, 2).map((c: any) => ({ ...c, mappedRole: PersonRoleType.CINEMATOGRAPHER }));
        const editors = crewList.filter((c: any) => ['Editor', 'Film Editor'].includes(c.job)).slice(0, 2).map((c: any) => ({ ...c, mappedRole: PersonRoleType.EDITOR }));

        const allPeople = [...topCast, ...directors, ...writers, ...producers, ...composers, ...cinematographers, ...editors];
        const uniqueTmdbIds = [...new Set(allPeople.map((person: any) => person.id as number))];
        const existingPeople = await prisma.person.findMany({
          where: { tmdbId: { in: uniqueTmdbIds } },
          select: { id: true, tmdbId: true, tmdbSyncedAt: true },
        });
        const existingByTmdbId = new Map(existingPeople.map((person) => [person.tmdbId, person]));
        const staleBefore = Date.now() - 90 * 86_400_000;
        const sortedPeople = [...allPeople].sort((a, b) => a.id - b.id);
        const processedPersons = new Map<number, string>(); // tmdbId -> prisma person.id

        for (const personItem of sortedPeople) {
          let personId = processedPersons.get(personItem.id);

          if (!personId) {
            const headshotUrl = personItem.profile_path
              ? `https://image.tmdb.org/t/p/w200${personItem.profile_path}`
              : null;

            const existingPerson = existingByTmdbId.get(personItem.id);
            const personData = {
              name: personItem.name,
              slug: `${generateSlug(personItem.name)}-${personItem.id}`,
              tmdbId: personItem.id,
              headshotUrl,
              gender: typeof personItem.gender === 'number' ? personItem.gender : null,
              knownForDepartment: personItem.known_for_department || null,
              popularity: typeof personItem.popularity === 'number' ? personItem.popularity : null,
            };

            const person = await PersonRepository.upsert(
              personItem.id,
              personData as any,
              { name: personData.name, slug: personData.slug, headshotUrl, gender: personData.gender, knownForDepartment: personData.knownForDepartment, popularity: personData.popularity } as any
            );
            personId = person.id;
            processedPersons.set(personItem.id, personId);
            if (!existingPerson?.tmdbSyncedAt || existingPerson.tmdbSyncedAt.getTime() < staleBefore) {
              peopleToEnrich.add(personItem.id);
            }
          }
          
          dbPeopleLinks.push({
            personId: personId,
            roleType: personItem.mappedRole,
            character: personItem.character || null,
            order: personItem.order || 0,
          });
        }
      }

      // --- PREPARE DICTIONARIES OUTSIDE TRANSACTION ---
      // Preparing Companies, Keywords, Countries, Languages, and Collection outside the interactive
      // transaction avoids holding DB connection locks and eliminates P2028 transaction timeout errors.

      // 1. Companies
      const dbCompanyIds: string[] = [];
      if (!lockedFields.includes('production_companies') && Array.isArray(tmdbMovie.production_companies)) {
        const sortedCompanies = [...tmdbMovie.production_companies].sort((a, b) => a.id - b.id);
        for (const pc of sortedCompanies) {
          const comp = await safeUpsertCompany(prisma, pc);
          dbCompanyIds.push(comp.id);
        }
      }

      // 2. Keywords
      const dbKeywordIds: string[] = [];
      const extra = tmdbMovie as any;
      if (!lockedFields.includes('keywords') && extra.keywords && extra.keywords.keywords) {
        for (const kw of extra.keywords.keywords) {
          const word = await safeUpsertKeyword(prisma, kw);
          dbKeywordIds.push(word.id);
        }
      }

      // 3. Countries
      const dbCountryIds: string[] = [];
      if (!lockedFields.includes('countries') && Array.isArray(tmdbMovie.production_countries)) {
        const sortedCountries = [...tmdbMovie.production_countries].sort((a, b) => (a.iso_3166_1 || '').localeCompare(b.iso_3166_1 || ''));
        for (const pc of sortedCountries) {
          if (!pc.iso_3166_1) continue;
          const country = await prisma.country.upsert({
            where: { isoCode: pc.iso_3166_1 },
            create: { isoCode: pc.iso_3166_1, name: pc.name },
            update: { name: pc.name }
          });
          dbCountryIds.push(country.id);
        }
      }

      // 4. Languages
      const dbLangIds: string[] = [];
      if (!lockedFields.includes('languages') && Array.isArray(tmdbMovie.spoken_languages)) {
        const sortedLangs = [...tmdbMovie.spoken_languages].sort((a, b) => (a.iso_639_1 || '').localeCompare(b.iso_639_1 || ''));
        for (const lang of sortedLangs) {
          if (!lang.iso_639_1) continue;
          const language = await prisma.language.upsert({
            where: { isoCode: lang.iso_639_1 },
            create: { isoCode: lang.iso_639_1, name: lang.name },
            update: { name: lang.name }
          });
          dbLangIds.push(language.id);
        }
      }

      // 5. Collections (Franchise)
      let dbCollectionId: string | null = null;
      let dbCollectionPartNumber = 0;
      if (tmdbMovie.belongs_to_collection) {
        const bc = tmdbMovie.belongs_to_collection;
        const coll = await prisma.collection.upsert({
          where: { slug: generateSlug(bc.name) },
          create: {
            title: bc.name,
            slug: generateSlug(bc.name),
            posterUrl: bc.poster_path ? `https://image.tmdb.org/t/p/w500${bc.poster_path}` : null,
            backdropUrl: bc.backdrop_path ? `https://image.tmdb.org/t/p/w1280${bc.backdrop_path}` : null,
          },
          update: {
            title: bc.name,
            posterUrl: bc.poster_path ? `https://image.tmdb.org/t/p/w500${bc.poster_path}` : null,
            backdropUrl: bc.backdrop_path ? `https://image.tmdb.org/t/p/w1280${bc.backdrop_path}` : null,
          }
        });
        dbCollectionId = coll.id;
        dbCollectionPartNumber = bc.part_number ?? 0;
      }

      // Orchestrate standard Prisma transaction for atomicity of the MOVIE and its links
      const savedMovie = await TransactionManager.run(
        async (tx) => {
          const movie = await MovieRepository.upsert(
            tmdbId,
            {
              ...movieData,
              status: 'DRAFT',
              tmdbSyncedAt: new Date(),
              title: movieData.title!,
              slug: movieData.slug!,
              releaseDate: movieData.releaseDate!,
              youtubeTrailerId: lockedFields.includes('trailers') ? existingMovie?.youtubeTrailerId : primaryTrailerId,
            } as any,
            {
              ...movieData,
              status: 'DRAFT',
              tmdbSyncedAt: new Date(),
              youtubeTrailerId: lockedFields.includes('trailers') ? undefined : primaryTrailerId,
            },
            tx
          );

          if (!lockedFields.includes('genres')) {
            await GenreRepository.clearMovieGenres(movie.id, tx);
            for (const g of dbGenres) {
              await GenreRepository.linkMovieGenre(movie.id, g.id, tx);
            }
          }

          if (!lockedFields.includes('cast') && hasCredits) {
            await tx.moviePerson.deleteMany({ where: { movieId: movie.id } }); // Clear ALL roles (Actor, Director, etc) to start fresh.
            
            // Deduplicate links in case a person has same role twice in TMDB
            const uniqueLinks = new Map();
            for (const link of dbPeopleLinks) {
              const key = `${link.personId}-${link.roleType}`;
              if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
            }

            for (const link of uniqueLinks.values()) {
              await PersonRepository.linkMoviePerson(
                {
                  movieId: movie.id,
                  personId: link.personId,
                  roleType: link.roleType,
                  characterName: link.character,
                  sortOrder: link.order,
                },
                tx
              );
            }
          }

          if (!lockedFields.includes('trailers') && hasVideos) {
            const videoResults = videos?.results || [];
            const supportedTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes', 'Bloopers'];
            const trailers = videoResults.filter(
              (v: any) => v.site === 'YouTube' && supportedTypes.includes(v.type)
            );
            await tx.trailer.updateMany({
              where: { movieId: movie.id, sourceType: TrailerSource.YOUTUBE, dataSource: 'TMDB' },
              data: { status: 'INACTIVE', isPrimary: false },
            });
            for (let i = 0; i < trailers.length; i++) {
              const video = trailers[i];
              const existingTrailer = await TrailerRepository.findBySourceId(
                movie.id,
                video.key,
                tx
              );

              let videoType: TrailerType = TrailerType.TRAILER;
              if (video.type === 'Teaser') videoType = TrailerType.TEASER;
              else if (video.type === 'Clip') videoType = TrailerType.CLIP;
              else if (video.type === 'Featurette') videoType = TrailerType.FEATURETTE;
              else if (video.type === 'Behind the Scenes') videoType = TrailerType.BEHIND_THE_SCENES;
              else if (video.type === 'Bloopers') videoType = TrailerType.BLOOPERS;

              if (!existingTrailer) {
                await TrailerRepository.create(
                  {
                    movieId: movie.id,
                    title: video.name || 'Trailer',
                    sourceType: TrailerSource.YOUTUBE,
                    sourceId: video.key,
                    videoType,
                    isPrimary: i === 0 && video.type === 'Trailer',
                    publishedDate: video.published_at ? new Date(video.published_at) : new Date(),
                    thumbnailUrl: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
                    dataSource: 'TMDB',
                  },
                  tx
                );
              } else {
                await tx.trailer.update({
                  where: { id: existingTrailer.id },
                  data: {
                    title: video.name || 'Trailer', videoType, status: 'ACTIVE',
                    isPrimary: i === 0 && video.type === 'Trailer',
                    publishedDate: video.published_at ? new Date(video.published_at) : existingTrailer.publishedDate,
                    thumbnailUrl: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
                    dataSource: 'TMDB',
                  },
                });
              }
            }
          }
          
          // Companies
          if (!lockedFields.includes('production_companies') && Array.isArray(tmdbMovie.production_companies)) {
            await tx.movieCompany.deleteMany({ where: { movieId: movie.id } });
            if (dbCompanyIds.length > 0) {
              await tx.movieCompany.createMany({
                data: dbCompanyIds.map(companyId => ({ movieId: movie.id, companyId })),
                skipDuplicates: true
              });
            }
          }

          // Keywords
          if (!lockedFields.includes('keywords') && extra.keywords && extra.keywords.keywords) {
            await tx.movieKeyword.deleteMany({ where: { movieId: movie.id } });
            if (dbKeywordIds.length > 0) {
              await tx.movieKeyword.createMany({
                data: dbKeywordIds.map(keywordId => ({ movieId: movie.id, keywordId })),
                skipDuplicates: true
              });
            }
          }

          // Countries
          if (!lockedFields.includes('countries') && Array.isArray(tmdbMovie.production_countries)) {
            await tx.movieCountry.deleteMany({ where: { movieId: movie.id } });
            if (dbCountryIds.length > 0) {
              await tx.movieCountry.createMany({
                data: dbCountryIds.map(countryId => ({ movieId: movie.id, countryId })),
                skipDuplicates: true
              });
            }
          }

          // Languages
          if (!lockedFields.includes('languages') && Array.isArray(tmdbMovie.spoken_languages)) {
            await tx.movieLanguage.deleteMany({ where: { movieId: movie.id } });
            if (dbLangIds.length > 0) {
              await tx.movieLanguage.createMany({
                data: dbLangIds.map(languageId => ({ movieId: movie.id, languageId })),
                skipDuplicates: true
              });
            }
          }

          // Collections (Franchise)
          await tx.collectionMovie.deleteMany({ where: { movieId: movie.id } });
          if (dbCollectionId) {
            await tx.collectionMovie.create({
              data: { collectionId: dbCollectionId, movieId: movie.id, sortOrder: dbCollectionPartNumber }
            });
          }

          return movie;
        },
        { timeout: 120000 }
      );

      // Enrich movie with extended entities (images, reviews, alt titles, watch providers, recommendations)
      const partialIssues: string[] = [...sourceIssues];
      try {
        const enrichment = await EnrichmentService.enrichMovie(savedMovie.id, tmdbMovie, prisma, lockedFields);
        partialIssues.push(...enrichment.issues);
      } catch (enrichErr) {
        logger.warn({ err: enrichErr, tmdbId }, `[importMovie] Failed to enrich movie ${tmdbId}, core movie was saved`);
        partialIssues.push('movie_enrichment_failed');
      }

      for (const personTmdbId of peopleToEnrich) {
        await ImportRepository.enqueue(personTmdbId, 'Person', true).catch((error) => {
          logger.warn({ err: error, personTmdbId }, '[importMovie] Failed to queue person enrichment');
          partialIssues.push(`person_queue_failed:${personTmdbId}`);
        });
      }

      const quality = usesLegacyQualityGate
        ? await ImportQualityService.evaluateLegacy(savedMovie.id)
        : await ImportQualityService.evaluate(savedMovie.id);
      return { movieId: savedMovie.id, tmdbId, quality, partialIssues };
    } catch (error) {
      if (error instanceof TmdbError && error.status === 404) {
        // A movie may disappear between TMDB discovery and the details request.
        // This is an expected permanent item failure, not a worker/system error.
        logger.warn(
          { tmdbId, status: error.status },
          '[importMovie] TMDB movie is no longer available; import skipped',
        );
      } else {
        logger.error({ err: error, tmdbId }, `[importMovie] Failed to import TMDB movie ${tmdbId}`);
      }
      throw error;
    }
  }

  /**
   * Smart patch that ONLY fetches getMovieExtra and updates missing DB fields.
   * Skips fetching heavy Credits (Actors) and Videos (Trailers) entirely.
   * Speeds up the "Investigate Missing Data" process by ~20x.
   */
  static async patchMissingData(tmdbId: number) {
    try {
      const existingMovie = await MovieRepository.findByTmdbId(tmdbId);
      if (!existingMovie) {
        throw new Error('Movie not found in database');
      }

      // 1 API call only with enriched response
      const tmdbMovie = await getMovieEnriched(tmdbId);
      const lockedFields: string[] = Array.isArray(existingMovie.lockedFields) 
        ? (existingMovie.lockedFields as string[]) 
        : [];
        
      const movieData = mapTmdbMovieToPrisma(tmdbMovie, lockedFields);

      // Extract fields that we care about patching
      const patchData: any = {};
      const isPosterMissing = !existingMovie.posterUrl || existingMovie.posterUrl.toLowerCase().includes('coming soon');
      const isSynopsisMissing = !existingMovie.synopsis || existingMovie.synopsis.toLowerCase().includes('coming soon');
      const isTrailerMissing = !existingMovie.youtubeTrailerId || existingMovie.youtubeTrailerId.toLowerCase().includes('coming soon');
      
      if (isPosterMissing && movieData.posterUrl) patchData.posterUrl = movieData.posterUrl;
      if (isSynopsisMissing && movieData.synopsis) patchData.synopsis = movieData.synopsis;
      
      if (isTrailerMissing && tmdbMovie.videos && tmdbMovie.videos.results) {
        const trailers = tmdbMovie.videos.results.filter((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
        if (trailers.length > 0) patchData.youtubeTrailerId = trailers[0].key;
      }
      
      if (!existingMovie.releaseDate && movieData.releaseDate) patchData.releaseDate = movieData.releaseDate;
      if (existingMovie.budget === null && movieData.budget) patchData.budget = movieData.budget;
      if (existingMovie.revenue === null && movieData.revenue) patchData.revenue = movieData.revenue;
      if (!existingMovie.ageRating && movieData.ageRating) patchData.ageRating = movieData.ageRating;
      if (!existingMovie.mpaaRating && movieData.mpaaRating) patchData.mpaaRating = movieData.mpaaRating;
      
      // JSON fields might be Prisma.DbNull or actual null in JS depending on query, check safely
      if (!existingMovie.watchProviders && movieData.watchProviders) patchData.watchProviders = movieData.watchProviders;
      if (!existingMovie.reviews && movieData.reviews) patchData.reviews = movieData.reviews;

      // 2. Prepare Companies if missing
      const companiesToLink: string[] = [];
      if (tmdbMovie.production_companies && tmdbMovie.production_companies.length > 0) {
        const existingCompanies = await prisma.movieCompany.count({ where: { movieId: existingMovie.id } });
        if (existingCompanies === 0) {
          const sortedComps = [...tmdbMovie.production_companies].sort((a, b) => a.id - b.id);
          for (const pc of sortedComps) {
            const comp = await safeUpsertCompany(prisma, pc);
            companiesToLink.push(comp.id);
          }
        }
      }

      // 3. Prepare Keywords if missing
      const keywordsToLink: string[] = [];
      const extra = tmdbMovie as any;
      if (extra.keywords && extra.keywords.keywords) {
        const existingKeywords = await prisma.movieKeyword.count({ where: { movieId: existingMovie.id } });
        if (existingKeywords === 0) {
          const sortedKw = [...extra.keywords.keywords].sort((a: any, b: any) => a.id - b.id);
          for (const kw of sortedKw) {
            const word = await safeUpsertKeyword(prisma, kw);
            keywordsToLink.push(word.id);
          }
        }
      }

      // 4. Prepare Countries if missing
      const countriesToLink: string[] = [];
      if (tmdbMovie.production_countries && tmdbMovie.production_countries.length > 0) {
        const existingCountries = await prisma.movieCountry.count({ where: { movieId: existingMovie.id } });
        if (existingCountries === 0) {
          const sorted = [...tmdbMovie.production_countries].sort((a, b) => (a.iso_3166_1 || '').localeCompare(b.iso_3166_1 || ''));
          for (const pc of sorted) {
            if (!pc.iso_3166_1) continue;
            const country = await prisma.country.upsert({
              where: { isoCode: pc.iso_3166_1 },
              create: { isoCode: pc.iso_3166_1, name: pc.name },
              update: { name: pc.name }
            });
            countriesToLink.push(country.id);
          }
        }
      }

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

      // 6. Prepare People (Crew/Cast) if missing
      const peopleToLink: any[] = [];
      const existingPeople = await prisma.moviePerson.count({ where: { movieId: existingMovie.id } });
      if (existingPeople === 0) {
        try {
          const credits = await getMovieCredits(tmdbId);
          const targetJobs = ['Director', 'Writer', 'Screenplay', 'Producer'];
          const relevantCrew = (credits.crew || []).filter((c: any) => targetJobs.includes(c.job));
          const topCast = (credits.cast || []).slice(0, 15);
          
          const allPeopleToProcess: any[] = [...relevantCrew, ...topCast];
          
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
                slug: `${generateSlug(p.name)}-${p.id}`,
                headshotUrl: p.profile_path ? `https://image.tmdb.org/t/p/w300${p.profile_path}` : null,
                gender: p.gender,
                knownForDepartment: p.known_for_department
              },
              update: {
                name: p.name,
                headshotUrl: p.profile_path ? `https://image.tmdb.org/t/p/w300${p.profile_path}` : null,
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
          logger.error({ err, tmdbId }, 'Failed to fetch credits during patch');
        }
      }

      await TransactionManager.run(async (tx) => {
        // 1. Force update to bump `updatedAt` timestamp, preventing infinite re-checks
        await tx.movie.update({
          where: { id: existingMovie.id },
          data: {
            ...patchData,
            updatedAt: new Date()
          }
        });

        // 2. Link Companies
        if (companiesToLink.length > 0) {
          await tx.movieCompany.createMany({
            data: companiesToLink.map(companyId => ({ movieId: existingMovie.id, companyId })),
            skipDuplicates: true
          });
        }

        // 3. Link Keywords
        if (keywordsToLink.length > 0) {
          await tx.movieKeyword.createMany({
            data: keywordsToLink.map(keywordId => ({ movieId: existingMovie.id, keywordId })),
            skipDuplicates: true
          });
        }

        // 4. Link Countries
        if (countriesToLink.length > 0) {
          await tx.movieCountry.createMany({
            data: countriesToLink.map(countryId => ({ movieId: existingMovie.id, countryId })),
            skipDuplicates: true
          });
        }

        // 5. Link Languages
        if (languagesToLink.length > 0) {
          await tx.movieLanguage.createMany({
            data: languagesToLink.map(languageId => ({ movieId: existingMovie.id, languageId })),
            skipDuplicates: true
          });
        }
        
        // 6. Link People
        if (peopleToLink.length > 0) {
          await tx.moviePerson.createMany({
            data: peopleToLink.map(p => ({ ...p, movieId: existingMovie.id })),
            skipDuplicates: true
          });
        }
      }, { timeout: 60000 });
      
      try {
        await EnrichmentService.enrichMovie(existingMovie.id, tmdbMovie, prisma, lockedFields);
      } catch (enrichErr) {
        logger.warn({ err: enrichErr, tmdbId }, `[patchMissingData] Failed to enrich movie ${tmdbId}`);
      }

      return { success: true };
    } catch (error: any) {
      const is404 = error?.status === 404 || error?.message?.includes('404');
      
      if (!is404) {
        logger.error({ err: error, tmdbId }, `[patchMissingData] Failed to patch TMDB movie ${tmdbId}`);
      }
      
      // If TMDB deleted the movie (404), bump our local timestamp so we don't infinitely retry checking it
      if (is404) {
        try {
          await prisma.movie.updateMany({
            where: { tmdbId },
            data: { updatedAt: new Date() }
          });
        } catch (e) {
          // ignore error if update fails
        }
      }
      
      throw error;
    }
  }
}

// Trigger HMR update

