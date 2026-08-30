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

      const dbCast: { personId: string; character: string; order: number }[] = [];
      if (!lockedFields.includes('cast')) {
        const castList = credits?.cast || [];
        const topCast = castList.slice(0, 10);
        const sortedCast = [...topCast].sort((a, b) => a.id - b.id);
        
        for (const castMember of sortedCast) {
          const headshotUrl = castMember.profile_path
            ? `https://image.tmdb.org/t/p/w200${castMember.profile_path}`
            : null;

          let personDetails = null;
          let personCredits = null;
          try {
            const [pDetails, pCredits] = await Promise.all([
              getPerson(castMember.id),
              getPersonCombinedCredits(castMember.id)
            ]);
            personDetails = pDetails;
            personCredits = pCredits;
          } catch (e) {
            logger.warn({ actorId: castMember.id }, `[importMovie] Failed to fetch deep profile for actor ${castMember.id}, using basic data`);
          }

          let topMovies: any = [];
          if (personCredits && personCredits.cast) {
            topMovies = personCredits.cast
              .filter((m: any) => m.media_type === 'movie' && m.poster_path)
              .sort((a: any, b: any) => b.popularity - a.popularity)
              .slice(0, 15);
          }

          const personData = {
            name: castMember.name,
            slug: `${generateSlug(castMember.name)}-${castMember.id}`,
            tmdbId: castMember.id,
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
            castMember.id,
            personData as any,
            personData as any
          );
          
          dbCast.push({
            personId: person.id,
            character: castMember.character,
            order: castMember.order,
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
            await PersonRepository.clearMovieRole(movie.id, PersonRoleType.ACTOR, tx);
            for (const c of dbCast) {
              await PersonRepository.linkMoviePerson(
                {
                  movieId: movie.id,
                  personId: c.personId,
                  roleType: PersonRoleType.ACTOR,
                  characterName: c.character,
                  sortOrder: c.order,
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
            for (const pc of tmdbMovie.production_companies) {
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
      if (!existingMovie.posterUrl && movieData.posterUrl) patchData.posterUrl = movieData.posterUrl;
      if (!existingMovie.synopsis && movieData.synopsis) patchData.synopsis = movieData.synopsis;
      if (!existingMovie.releaseDate && movieData.releaseDate) patchData.releaseDate = movieData.releaseDate;
      if (existingMovie.budget === null && movieData.budget) patchData.budget = movieData.budget;
      if (existingMovie.revenue === null && movieData.revenue) patchData.revenue = movieData.revenue;
      if (!existingMovie.ageRating && movieData.ageRating) patchData.ageRating = movieData.ageRating;
      
      // JSON fields might be Prisma.DbNull or actual null in JS depending on query, check safely
      if (!existingMovie.watchProviders && movieData.watchProviders) patchData.watchProviders = movieData.watchProviders;
      if (!existingMovie.reviews && movieData.reviews) patchData.reviews = movieData.reviews;

      // 2. Prepare Companies if missing
      const companiesToLink: string[] = [];
      if (tmdbMovie.production_companies && tmdbMovie.production_companies.length > 0) {
        const existingCompanies = await prisma.movieCompany.count({ where: { movieId: existingMovie.id } });
        if (existingCompanies === 0) {
          for (const pc of tmdbMovie.production_companies) {
            const comp = await prisma.productionCompany.upsert({
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
          for (const kw of extra.keywords.keywords) {
            const word = await prisma.keyword.upsert({
              where: { tmdbId: kw.id },
              create: { name: kw.name, tmdbId: kw.id },
              update: { name: kw.name }
            });
            keywordsToLink.push(word.id);
          }
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

