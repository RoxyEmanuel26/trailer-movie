import { getMovie, getMovieCredits, getMovieVideos } from '../tmdb/api';
import { mapTmdbMovieToPrisma, generateSlug } from '../tmdb/mapping';
import { PersonRoleType, TrailerSource, TrailerType } from '@prisma/client';

import { MovieRepository } from '../repositories/MovieRepository';
import { GenreRepository } from '../repositories/GenreRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { TrailerRepository } from '../repositories/TrailerRepository';
import { TransactionManager } from '../repositories/TransactionManager';

export class SyncService {
  static async importMovie(tmdbId: number) {
    try {
      const [tmdbMovie, credits, videos] = await Promise.all([
        getMovie(tmdbId),
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
        const sortedTmdbGenres = [...tmdbMovie.genres].sort((a, b) => a.id - b.id);
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
        const topCast = credits.cast.slice(0, 10);
        const sortedCast = [...topCast].sort((a, b) => a.id - b.id);
        
        for (const castMember of sortedCast) {
          const headshotUrl = castMember.profile_path
            ? `https://image.tmdb.org/t/p/w200${castMember.profile_path}`
            : null;

          const person = await PersonRepository.upsert(
            castMember.id,
            {
              name: castMember.name,
              slug: generateSlug(castMember.name),
              tmdbId: castMember.id,
              headshotUrl,
            },
            { name: castMember.name, headshotUrl }
          );
          
          // Note: we still use the original character/order for linking
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
            const trailers = videos.results.filter(
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
                    title: video.name,
                    sourceType: TrailerSource.YOUTUBE,
                    sourceId: video.key,
                    videoType: TrailerType.TRAILER,
                    isPrimary: i === 0,
                    publishedDate: new Date(video.published_at),
                    thumbnailUrl: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
                  },
                  tx
                );
              }
            }
          }

          return movie;
        },
        { timeout: 10000 }
      );

      return savedMovie;
    } catch (error) {
      console.error(`Failed to import TMDB movie ${tmdbId}`, error);
      throw error;
    }
  }
}
