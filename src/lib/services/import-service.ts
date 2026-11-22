import { getMovieCredits, getMovieEnriched } from '../tmdb/api';
import { mapTmdbMovieToPrisma, generateSlug } from '../tmdb/mapping';
import { PersonRoleType, TrailerSource, TrailerType } from '@prisma/client';
import { EnrichmentService } from './enrichment-service';

import { MovieRepository } from '../repositories/MovieRepository';
import { GenreRepository } from '../repositories/GenreRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { TransactionManager } from '../repositories/TransactionManager';
import { prisma } from '../prisma';
import { logger } from '../logger';
import { ImportRepository } from '../repositories/ImportRepository';
import { ImportQualityService } from './ImportQualityService';
import { TmdbError } from '../tmdb/errors';
import { moviePath } from '../public-routes';
import { submitIndexNowUrls } from '../indexnow';
import { isLocalImportMode } from '../jobs/execution-mode';

function parseOptionalDate(value: unknown, fallback: Date): Date {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function safeUpsertFranchiseCollection(
  db: any,
  bc: { id: number; name?: string | null; poster_path?: string | null; backdrop_path?: string | null },
) {
  const title = (bc.name || '').trim() || `Collection ${bc.id}`;
  const slugBase = generateSlug(title) || 'collection';
  const slug = `${slugBase}-${bc.id}`;
  const posterUrl = bc.poster_path ? `https://image.tmdb.org/t/p/w500${bc.poster_path}` : null;
  const backdropUrl = bc.backdrop_path ? `https://image.tmdb.org/t/p/w1280${bc.backdrop_path}` : null;

  let coll = await db.collection.findUnique({ where: { tmdbId: bc.id } });
  if (coll) {
    const needsSlugRepair = !coll.slug || !coll.slug.trim();
    if (
      coll.title !== title ||
      coll.posterUrl !== posterUrl ||
      coll.backdropUrl !== backdropUrl ||
      needsSlugRepair
    ) {
      coll = await db.collection.update({
        where: { id: coll.id },
        data: {
          title,
          posterUrl,
          backdropUrl,
          ...(needsSlugRepair ? { slug } : {}),
        },
      });
    }
    return coll;
  }

  await db.collection.createMany({
    data: [{ tmdbId: bc.id, title, slug, posterUrl, backdropUrl }],
    skipDuplicates: true,
  });
  coll = await db.collection.findUnique({ where: { tmdbId: bc.id } });
  if (!coll) {
    coll = await db.collection.findUnique({ where: { slug } });
  }
  if (!coll) throw new Error(`Collection ${bc.id} could not be persisted`);
  return coll;
}

// Helpers to prevent P2002 Unique Constraint errors on concurrent batch imports 
// without relying on try-catch, which breaks SQL transactions in Prisma.
export async function safeUpsertKeyword(tx: any, kw: { id: number; name: string }) {
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
    // The name is already the canonical local keyword. Do not steal its TMDB ID
    // from a concurrently imported row; both movies can safely share this row.
    return word;
  }

  // PostgreSQL translates skipDuplicates to ON CONFLICT DO NOTHING. A parallel
  // movie importing the same dictionary value therefore cannot abort this job.
  await tx.keyword.createMany({
    data: [{ name: kw.name, tmdbId: kw.id }],
    skipDuplicates: true,
  });
  word = await tx.keyword.findUnique({ where: { tmdbId: kw.id } });
  if (!word) {
    word = await tx.keyword.findFirst({ where: { name: { equals: kw.name, mode: 'insensitive' } } });
  }
  if (!word) throw new Error(`Keyword ${kw.id} could not be persisted`);
  return word;
}

export async function safeUpsertCompany(tx: any, pc: { id: number; name: string; logo_path?: string }) {
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
    if (comp.logoUrl !== logoUrl) {
      comp = await tx.productionCompany.update({ where: { id: comp.id }, data: { logoUrl } });
    }
    return comp;
  }

  await tx.productionCompany.createMany({
    data: [{ name: pc.name, tmdbId: pc.id, logoUrl, slug }],
    skipDuplicates: true,
  });
  comp = await tx.productionCompany.findUnique({ where: { tmdbId: pc.id } });
  if (!comp) comp = await tx.productionCompany.findUnique({ where: { slug } });
  if (!comp) {
    comp = await tx.productionCompany.findFirst({ where: { name: { equals: pc.name, mode: 'insensitive' } } });
  }
  if (!comp) throw new Error(`Production company ${pc.id} could not be persisted`);
  return comp;
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
      if (existingMovie?.deletedAt) {
        logger.info({ tmdbId, movieId: existingMovie.id }, '[importMovie] Skipping soft-deleted movie');
        return {
          movieId: existingMovie.id,
          tmdbId,
          skipped: true,
          quality: { ready: false, issues: [] },
          partialIssues: [],
        };
      }
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
      const dbGenres: { tmdbId: number | null; id: string }[] = [];
      if (!lockedFields.includes('genres')) {
        const genresList: Array<{ id: number; name: string }> = Array.isArray(tmdbMovie.genres) ? tmdbMovie.genres : [];
        const genreIds = [...new Set(genresList.map((genre) => genre.id))];
        const genreSlugs = [...new Set(genresList.map((genre) => generateSlug(genre.name)).filter(Boolean))];
        if (genreIds.length > 0) {
          await prisma.genre.createMany({
            data: genresList.map((genre: { id: number; name: string }) => ({
              tmdbId: genre.id, name: genre.name, slug: generateSlug(genre.name),
            })),
            skipDuplicates: true,
          });
          const genres = await prisma.genre.findMany({
            where: {
              OR: [
                { tmdbId: { in: genreIds } },
                ...(genreSlugs.length > 0 ? [{ slug: { in: genreSlugs } }] : []),
              ],
            },
            select: { id: true, tmdbId: true, slug: true },
          });
          const tmdbIdBySlug = new Map(genresList.map((genre) => [generateSlug(genre.name), genre.id]));
          for (const genre of genres) {
            if (genre.tmdbId === null) {
              const matchedTmdbId = tmdbIdBySlug.get(genre.slug);
              if (matchedTmdbId !== undefined) {
                await prisma.genre.updateMany({
                  where: { id: genre.id, tmdbId: null },
                  data: { tmdbId: matchedTmdbId },
                }).catch(() => undefined);
              }
            }
            dbGenres.push({ id: genre.id, tmdbId: genre.tmdbId });
          }
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
        const uniquePeople = [...new Map(allPeople.map((person: any) => [person.id as number, person])).values()];
        const missingPeople = uniquePeople
          .filter((person: any) => !existingByTmdbId.has(person.id))
          .sort((a: any, b: any) => Number(a.id) - Number(b.id));
        if (missingPeople.length > 0) {
          await prisma.person.createMany({
            data: missingPeople.map((person: any) => ({
              tmdbId: person.id,
              name: person.name || `Person ${person.id}`,
              slug: `${generateSlug(person.name || '') || 'person'}-${person.id}`,
              headshotUrl: person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : null,
              gender: typeof person.gender === 'number' ? person.gender : null,
              knownForDepartment: person.known_for_department || null,
              popularity: typeof person.popularity === 'number' ? person.popularity : null,
            })),
            skipDuplicates: true,
          });
        }
        // Existing profiles are enriched by their dedicated person job. Movie-credit snapshots
        // should not repeatedly overwrite a fresh biography/headshot or spend one write per credit.
        const people = missingPeople.length > 0
          ? await prisma.person.findMany({
              where: { tmdbId: { in: uniqueTmdbIds } }, select: { id: true, tmdbId: true, tmdbSyncedAt: true },
            })
          : existingPeople;
        const peopleByTmdbId = new Map(people.map((person) => [person.tmdbId, person]));

        for (const personItem of allPeople) {
          const person = peopleByTmdbId.get(personItem.id);
          if (!person) throw new Error(`Person ${personItem.id} could not be persisted`);
          if (!person.tmdbSyncedAt || person.tmdbSyncedAt.getTime() < staleBefore) {
            peopleToEnrich.add(personItem.id);
          }
          dbPeopleLinks.push({
            personId: person.id,
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
        const existingCompanies = sortedCompanies.length > 0
          ? await prisma.productionCompany.findMany({ where: { tmdbId: { in: sortedCompanies.map((company) => company.id) } } })
          : [];
        const existingByTmdbId = new Map(existingCompanies.map((company) => [company.tmdbId, company]));
        for (const pc of sortedCompanies) {
          const existing = existingByTmdbId.get(pc.id);
          const logoUrl = pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null;
          const comp = existing
            ? existing.name !== pc.name || existing.logoUrl !== logoUrl
              ? await prisma.productionCompany.update({ where: { id: existing.id }, data: { name: pc.name, logoUrl } })
              : existing
            : await safeUpsertCompany(prisma, pc);
          dbCompanyIds.push(comp.id);
        }
      }

      // 2. Keywords
      const dbKeywordIds: string[] = [];
      const extra = tmdbMovie as any;
      if (!lockedFields.includes('keywords') && extra.keywords && extra.keywords.keywords) {
        const keywordIds = extra.keywords.keywords.map((keyword: { id: number }) => keyword.id);
        const existingKeywords = keywordIds.length > 0
          ? await prisma.keyword.findMany({ where: { tmdbId: { in: keywordIds } } })
          : [];
        const existingByTmdbId = new Map(existingKeywords.map((keyword) => [keyword.tmdbId, keyword]));
        for (const kw of extra.keywords.keywords) {
          const existing = existingByTmdbId.get(kw.id);
          const word = existing && existing.name === kw.name ? existing : await safeUpsertKeyword(prisma, kw);
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
      if (!lockedFields.includes('collections') && tmdbMovie.belongs_to_collection?.id) {
        const bc = tmdbMovie.belongs_to_collection;
        const coll = await safeUpsertFranchiseCollection(prisma, bc);
        dbCollectionId = coll.id;
        dbCollectionPartNumber = bc.part_number ?? 0;
      }

      // Orchestrate standard Prisma transaction for atomicity of the MOVIE and its links
      const { status: _mappedStatus, ...movieUpdatePayload } = movieData;
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
              ...movieUpdatePayload,
              tmdbSyncedAt: new Date(),
              youtubeTrailerId: lockedFields.includes('trailers') ? undefined : primaryTrailerId,
            },
            tx
          );

          if (!lockedFields.includes('genres')) {
            await GenreRepository.clearMovieGenres(movie.id, tx);
            if (dbGenres.length > 0) {
              await tx.movieGenre.createMany({
                data: dbGenres.map((genre) => ({ movieId: movie.id, genreId: genre.id })),
                skipDuplicates: true,
              });
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

            if (uniqueLinks.size > 0) {
              await tx.moviePerson.createMany({
                data: [...uniqueLinks.values()].map((link) => ({
                  movieId: movie.id,
                  personId: link.personId,
                  roleType: link.roleType,
                  characterName: link.character,
                  sortOrder: link.order,
                })),
                skipDuplicates: true,
              });
            }
          }

          if (!lockedFields.includes('trailers') && hasVideos) {
            const videoResults = videos?.results || [];
            const supportedTypes = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes', 'Bloopers'];
            const seenKeys = new Set<string>();
            const trailers = videoResults.filter((v: any) => {
              if (v.site !== 'YouTube' || !supportedTypes.includes(v.type) || typeof v.key !== 'string' || !v.key.trim()) {
                return false;
              }
              if (seenKeys.has(v.key)) return false;
              seenKeys.add(v.key);
              return true;
            });
            const existingTrailers = trailers.length > 0
              ? await tx.trailer.findMany({
                  where: { movieId: movie.id, sourceId: { in: trailers.map((video: any) => video.key) } },
                })
              : [];
            const existingBySourceId = new Map(existingTrailers.map((trailer) => [trailer.sourceId, trailer]));
            await tx.trailer.updateMany({
              where: { movieId: movie.id, sourceType: TrailerSource.YOUTUBE, dataSource: 'TMDB' },
              data: { status: 'INACTIVE', isPrimary: false },
            });
            const newTrailers: Array<{
              movieId: string; title: string; sourceType: TrailerSource; sourceId: string;
              videoType: TrailerType; isPrimary: boolean; publishedDate: Date;
              thumbnailUrl: string; dataSource: 'TMDB';
            }> = [];
            for (const video of trailers) {
              const existingTrailer = existingBySourceId.get(video.key);
              const isPrimaryVideo = Boolean(primaryTrailerId && video.key === primaryTrailerId);
              const thumbnailUrl = `https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`;

              let videoType: TrailerType = TrailerType.TRAILER;
              if (video.type === 'Teaser') videoType = TrailerType.TEASER;
              else if (video.type === 'Clip') videoType = TrailerType.CLIP;
              else if (video.type === 'Featurette') videoType = TrailerType.FEATURETTE;
              else if (video.type === 'Behind the Scenes') videoType = TrailerType.BEHIND_THE_SCENES;
              else if (video.type === 'Bloopers') videoType = TrailerType.BLOOPERS;

              if (!existingTrailer) {
                newTrailers.push({
                  movieId: movie.id,
                  title: video.name || 'Trailer',
                  sourceType: TrailerSource.YOUTUBE,
                  sourceId: video.key,
                  videoType,
                  isPrimary: isPrimaryVideo,
                  publishedDate: parseOptionalDate(video.published_at, new Date()),
                  thumbnailUrl,
                  dataSource: 'TMDB',
                });
              } else {
                await tx.trailer.update({
                  where: { id: existingTrailer.id },
                  data: {
                    title: video.name || 'Trailer', videoType, status: 'ACTIVE',
                    isPrimary: isPrimaryVideo,
                    publishedDate: parseOptionalDate(video.published_at, existingTrailer.publishedDate || new Date()),
                    thumbnailUrl,
                    dataSource: 'TMDB',
                  },
                });
              }
            }
            if (newTrailers.length > 0) {
              await tx.trailer.createMany({ data: newTrailers, skipDuplicates: true });
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

          // Collections (Franchise — never delete manual admin collections!)
          if (!lockedFields.includes('collections')) {
            await tx.collectionMovie.deleteMany({
              where: {
                movieId: movie.id,
                collection: { tmdbId: { not: null } },
              },
            });
            if (dbCollectionId) {
              await tx.collectionMovie.createMany({
                data: [{ collectionId: dbCollectionId, movieId: movie.id, sortOrder: dbCollectionPartNumber }],
                skipDuplicates: true,
              });
            }
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

      if (peopleToEnrich.size > 0) {
        await ImportRepository.enqueuePersons([...peopleToEnrich]).catch((error) => {
          logger.warn({ err: error, tmdbId }, '[importMovie] Failed to queue person enrichment');
          partialIssues.push('person_queue_failed');
        });
      }

      const quality = usesLegacyQualityGate
        ? await ImportQualityService.evaluateLegacy(savedMovie.id)
        : await ImportQualityService.evaluate(savedMovie.id);
      if (quality.ready && !isLocalImportMode()) {
        void submitIndexNowUrls([moviePath(savedMovie.slug)]).catch(() => undefined);
      }
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
      if (existingMovie.deletedAt) {
        return { success: true, updated: false, skipped: true };
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
      
      if (isTrailerMissing && !lockedFields.includes('trailers') && tmdbMovie.videos && tmdbMovie.videos.results) {
        const trailers = tmdbMovie.videos.results
          .filter((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
          .sort((a: any, b: any) => Number(b.official) - Number(a.official));
        if (trailers.length > 0) patchData.youtubeTrailerId = trailers[0].key;
      }
      
      if (!existingMovie.releaseDate && movieData.releaseDate) patchData.releaseDate = movieData.releaseDate;
      if (existingMovie.budget === null && movieData.budget) patchData.budget = movieData.budget;
      if (existingMovie.revenue === null && movieData.revenue) patchData.revenue = movieData.revenue;
      if (!existingMovie.ageRating && movieData.ageRating) patchData.ageRating = movieData.ageRating;
      if (!existingMovie.mpaaRating && movieData.mpaaRating) patchData.mpaaRating = movieData.mpaaRating;
      
      // JSON fields might be Prisma.DbNull or actual null in JS depending on query, check safely
      if (!existingMovie.watchProviders && movieData.watchProviders && !lockedFields.includes('watchProviders') && !lockedFields.includes('watch_providers')) {
        patchData.watchProviders = movieData.watchProviders;
      }
      if (!existingMovie.reviews && movieData.reviews && !lockedFields.includes('reviews')) {
        patchData.reviews = movieData.reviews;
      }

      // 2. Prepare Companies if missing
      const companiesToLink: string[] = [];
      if (!lockedFields.includes('production_companies') && tmdbMovie.production_companies && tmdbMovie.production_companies.length > 0) {
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
      if (!lockedFields.includes('keywords') && extra.keywords && extra.keywords.keywords) {
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
      if (!lockedFields.includes('countries') && tmdbMovie.production_countries && tmdbMovie.production_countries.length > 0) {
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
      if (!lockedFields.includes('languages') && tmdbMovie.spoken_languages && tmdbMovie.spoken_languages.length > 0) {
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
      const existingPeople = !lockedFields.includes('cast')
        ? await prisma.moviePerson.count({ where: { movieId: existingMovie.id } })
        : 1;
      if (existingPeople === 0) {
        try {
          const credits =
            tmdbMovie.credits &&
            (Array.isArray(tmdbMovie.credits.cast) || Array.isArray(tmdbMovie.credits.crew))
              ? tmdbMovie.credits
              : await getMovieCredits(tmdbId);
          const targetJobs = ['Director', 'Writer', 'Screenplay', 'Producer'];
          const relevantCrew = (credits.crew || []).filter((c: any) => targetJobs.includes(c.job));
          const topCast = (credits.cast || []).slice(0, 15);
          
          const allPeopleToProcess: any[] = [...relevantCrew, ...topCast];
          
          for (const p of allPeopleToProcess) {
            let roleType = 'ACTOR';
            if (p.job === 'Director') roleType = 'DIRECTOR';
            else if (p.job === 'Writer' || p.job === 'Screenplay') roleType = 'WRITER';
            else if (p.job === 'Producer') roleType = 'PRODUCER';
            const headshotUrl = p.profile_path ? `https://image.tmdb.org/t/p/w300${p.profile_path}` : null;
            
            const person = await prisma.person.upsert({
              where: { tmdbId: p.id },
              create: {
                tmdbId: p.id,
                name: p.name || `Person ${p.id}`,
                slug: `${generateSlug(p.name || '') || 'person'}-${p.id}`,
                headshotUrl,
                gender: p.gender,
                knownForDepartment: p.known_for_department
              },
              update: {
                name: p.name || undefined,
                ...(headshotUrl ? { headshotUrl } : {}),
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
      
      const hasDirectPatch =
        Object.keys(patchData).length > 0 ||
        companiesToLink.length > 0 ||
        keywordsToLink.length > 0 ||
        countriesToLink.length > 0 ||
        languagesToLink.length > 0 ||
        peopleToLink.length > 0;

      try {
        await EnrichmentService.enrichMovie(existingMovie.id, tmdbMovie, prisma, lockedFields);
      } catch (enrichErr) {
        logger.warn({ err: enrichErr, tmdbId }, `[patchMissingData] Failed to enrich movie ${tmdbId}`);
      }

      const usesLegacyQualityGate = existingMovie.createdAt < new Date('2026-09-14T00:00:00.000Z');
      if (usesLegacyQualityGate) {
        await ImportQualityService.evaluateLegacy(existingMovie.id, prisma, { preserveStatus: true });
      } else {
        await ImportQualityService.evaluate(existingMovie.id, prisma, { preserveStatus: true });
      }

      return { success: true, updated: hasDirectPatch };
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

