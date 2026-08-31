import { getMovieExtra, getMovieCredits, getMovieVideos, getPerson, getPersonCombinedCredits } from '../tmdb/api';
import { mapTmdbMovieToPrisma, generateSlug } from '../tmdb/mapping';
import { PersonRoleType, TrailerSource, TrailerType } from '@prisma/client';

import { MovieRepository } from '../repositories/MovieRepository';
import { GenreRepository } from '../repositories/GenreRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { TrailerRepository } from '../repositories/TrailerRepository';
import { TransactionManager } from '../repositories/TransactionManager';
import { prisma } from '../prisma';
import { logger } from '../logger';

export class SyncService {
  static async importMovie(tmdbId: number) {
    try {
      const [tmdbMovie, credits, videos] = await Promise.all([
        getMovieExtra(tmdbId),
        getMovieCredits(tmdbId),
        getMovieVideos(tmdbId),
      ]);

      const existingMovie = await MovieRepository.findByTmdbId(tmdbId);

      const lockedFields: string[] = Array.isArray(existingMovie?.lockedFields)
        ? (existingMovie?.lockedFields as string[])
        : [];

      let primaryTrailerId = null;
      if (videos && videos.results) {
        const trailers = videos.results.filter(
          (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
        );
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
      if (!lockedFields.includes('cast')) {
        const castList = credits?.cast || [];
        const topCast = castList.slice(0, 10).map((c: any) => ({ ...c, mappedRole: PersonRoleType.ACTOR }));
        
        const crewList = credits?.crew || [];
        const directors = crewList.filter((c: any) => c.job === 'Director').slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.DIRECTOR }));
        const writers = crewList.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.WRITER }));
        const producers = crewList.filter((c: any) => c.job === 'Producer').slice(0, 3).map((c: any) => ({ ...c, mappedRole: PersonRoleType.PRODUCER }));

        const allPeople = [...topCast, ...directors, ...writers, ...producers];
        const sortedPeople = [...allPeople].sort((a, b) => a.id - b.id);
        const processedPersons = new Map<number, string>(); // tmdbId -> prisma person.id

        for (const personItem of sortedPeople) {
          let personId = processedPersons.get(personItem.id);

          if (!personId) {
            const headshotUrl = personItem.profile_path
              ? `https://image.tmdb.org/t/p/w200${personItem.profile_path}`
              : null;

            let personDetails = null;
            let personCredits = null;
            try {
              const [pDetails, pCredits] = await Promise.all([
                getPerson(personItem.id),
                getPersonCombinedCredits(personItem.id)
              ]);
              personDetails = pDetails;
              personCredits = pCredits;
            } catch (e) {
              logger.warn({ personId: personItem.id }, `[importMovie] Failed to fetch deep profile for person ${personItem.id}, using basic data`);
            }

            let topMovies: any = [];
            if (personCredits && personCredits.cast) {
              topMovies = personCredits.cast
                .filter((m: any) => m.media_type === 'movie' && m.poster_path)
                .sort((a: any, b: any) => b.popularity - a.popularity)
                .slice(0, 15);
            }

            const personData = {
              name: personItem.name,
              slug: `${generateSlug(personItem.name)}-${personItem.id}`,
              tmdbId: personItem.id,
              headshotUrl,
              biography: personDetails?.biography || null,
              birthday: personDetails?.birthday ? new Date(personDetails.birthday) : null,
              deathday: personDetails?.deathday ? new Date(personDetails.deathday) : null,
              placeOfBirth: personDetails?.place_of_birth || null,
              gender: personDetails?.gender || null,
              knownForDepartment: personDetails?.known_for_department || null,
              topMovies: topMovies.length > 0 ? topMovies : null,
            };

            const person = await PersonRepository.upsert(
              personItem.id,
              personData as any,
              personData as any
            );
            personId = person.id;
            processedPersons.set(personItem.id, personId);
          }
          
          dbPeopleLinks.push({
            personId: personId,
            roleType: personItem.mappedRole,
            character: personItem.character || null,
            order: personItem.order || 0,
          });
        }
      }

      // Orchestrate standard Prisma transaction for atomicity of the MOVIE and its links
      const savedMovie = await TransactionManager.run(
        async (tx) => {
          const movie = await MovieRepository.upsert(
            tmdbId,
            {
              ...movieData,
              title: movieData.title!,
              slug: movieData.slug!,
              releaseDate: movieData.releaseDate!,
              youtubeTrailerId: lockedFields.includes('trailers') ? existingMovie?.youtubeTrailerId : primaryTrailerId,
            } as any,
            {
              ...movieData,
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

          if (!lockedFields.includes('cast')) {
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

          if (!lockedFields.includes('trailers')) {
            const videoResults = videos?.results || [];
            const trailers = videoResults.filter(
              (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
            );
            for (let i = 0; i < trailers.length; i++) {
              const video = trailers[i];
              const existingTrailer = await TrailerRepository.findBySourceId(
                movie.id,
                video.key,
                tx
              );

              if (!existingTrailer) {
                await TrailerRepository.create(
                  {
                    movieId: movie.id,
                    title: video.name || 'Trailer',
                    sourceType: TrailerSource.YOUTUBE,
                    sourceId: video.key,
                    videoType: TrailerType.TRAILER,
                    isPrimary: i === 0,
                    publishedDate: video.published_at ? new Date(video.published_at) : new Date(),
                    thumbnailUrl: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
                  },
                  tx
                );
              }
            }
          }
          
          // --- NEW DATA (Companies, Keywords, Collections) ---
          
          // Companies
          if (tmdbMovie.production_companies && tmdbMovie.production_companies.length > 0) {
            await tx.movieCompany.deleteMany({ where: { movieId: movie.id } });
            const companyIds: string[] = [];
            const sortedCompanies = [...tmdbMovie.production_companies].sort((a, b) => a.id - b.id);
            for (const pc of sortedCompanies) {
              const comp = await tx.productionCompany.upsert({
                where: { tmdbId: pc.id },
                create: {
                  name: pc.name,
                  slug: `${generateSlug(pc.name)}-${pc.id}`,
                  tmdbId: pc.id,
                  logoUrl: pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null,
                },
                update: {
                  name: pc.name,
                  logoUrl: pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null,
                }
              });
              companyIds.push(comp.id);
            }
            if (companyIds.length > 0) {
              await tx.movieCompany.createMany({
                data: companyIds.map(companyId => ({ movieId: movie.id, companyId })),
                skipDuplicates: true
              });
            }
          }

          // Keywords
          const extra = tmdbMovie as any;
          if (extra.keywords && extra.keywords.keywords) {
            await tx.movieKeyword.deleteMany({ where: { movieId: movie.id } });
            const keywordIds: string[] = [];
            for (const kw of extra.keywords.keywords) {
              const word = await tx.keyword.upsert({
                where: { tmdbId: kw.id },
                create: { name: kw.name, tmdbId: kw.id },
                update: { name: kw.name }
              });
              keywordIds.push(word.id);
            }
            if (keywordIds.length > 0) {
              await tx.movieKeyword.createMany({
                data: keywordIds.map(keywordId => ({ movieId: movie.id, keywordId })),
                skipDuplicates: true
              });
            }
          }

          // Countries
          if (tmdbMovie.production_countries && tmdbMovie.production_countries.length > 0) {
            await tx.movieCountry.deleteMany({ where: { movieId: movie.id } });
            const countryIds: string[] = [];
            const sortedCountries = [...tmdbMovie.production_countries].sort((a, b) => (a.iso_3166_1 || '').localeCompare(b.iso_3166_1 || ''));
            for (const pc of sortedCountries) {
              if (!pc.iso_3166_1) continue;
              const country = await tx.country.upsert({
                where: { isoCode: pc.iso_3166_1 },
                create: { isoCode: pc.iso_3166_1, name: pc.name },
                update: { name: pc.name }
              });
              countryIds.push(country.id);
            }
            if (countryIds.length > 0) {
              await tx.movieCountry.createMany({
                data: countryIds.map(countryId => ({ movieId: movie.id, countryId })),
                skipDuplicates: true
              });
            }
          }

          // Languages
          if (tmdbMovie.spoken_languages && tmdbMovie.spoken_languages.length > 0) {
            await tx.movieLanguage.deleteMany({ where: { movieId: movie.id } });
            const langIds: string[] = [];
            const sortedLangs = [...tmdbMovie.spoken_languages].sort((a, b) => (a.iso_639_1 || '').localeCompare(b.iso_639_1 || ''));
            for (const lang of sortedLangs) {
              if (!lang.iso_639_1) continue;
              const language = await tx.language.upsert({
                where: { isoCode: lang.iso_639_1 },
                create: { isoCode: lang.iso_639_1, name: lang.name },
                update: { name: lang.name }
              });
              langIds.push(language.id);
            }
            if (langIds.length > 0) {
              await tx.movieLanguage.createMany({
                data: langIds.map(languageId => ({ movieId: movie.id, languageId })),
                skipDuplicates: true
              });
            }
          }

          // Collections (Franchise)
          if (tmdbMovie.belongs_to_collection) {
            const bc = tmdbMovie.belongs_to_collection;
            await tx.collectionMovie.deleteMany({ where: { movieId: movie.id } });
            const coll = await tx.collection.upsert({
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
            await tx.collectionMovie.create({
              data: { collectionId: coll.id, movieId: movie.id, sortOrder: bc.part_number ?? 0 }
            });
          }

          return movie;
        },
        { timeout: 25000 }
      );

      return savedMovie;
    } catch (error) {
      logger.error({ err: error, tmdbId }, `[importMovie] Failed to import TMDB movie ${tmdbId}`);
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

      // 1 API call only
      const tmdbMovie = await getMovieExtra(tmdbId);
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
            const comp = await prisma.productionCompany.upsert({
              where: { tmdbId: pc.id },
              create: {
                name: pc.name,
                slug: `${generateSlug(pc.name)}-${pc.id}`,
                logoUrl: pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null,
                tmdbId: pc.id
              },
              update: {
                name: pc.name,
                logoUrl: pc.logo_path ? `https://image.tmdb.org/t/p/w200${pc.logo_path}` : null,
              }
            });
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
            const word = await prisma.keyword.upsert({
              where: { tmdbId: kw.id },
              create: { name: kw.name, tmdbId: kw.id },
              update: { name: kw.name }
            });
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
      }, { timeout: 15000 });
      
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

