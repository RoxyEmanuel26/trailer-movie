import { getMovie, getMovieCredits, getMovieVideos } from '../tmdb/api';
import { mapTmdbMovieToPrisma, generateSlug } from '../tmdb/mapping';
import { prisma } from '../prisma';
import { PersonRoleType, TrailerSource, TrailerType } from '@prisma/client';

import { MovieRepository } from '../repositories/MovieRepository';
import { GenreRepository } from '../repositories/GenreRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { TrailerRepository } from '../repositories/TrailerRepository';

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

      const movieData = mapTmdbMovieToPrisma(tmdbMovie, lockedFields);

      // Orchestrate standard Prisma transaction for atomicity
      const savedMovie = await prisma.$transaction(
        async (tx) => {
          const movie = await MovieRepository.upsert(
            tmdbId,
            {
              ...movieData,
              title: movieData.title!,
              slug: movieData.slug!,
              releaseDate: movieData.releaseDate!,
            } as any,
            movieData,
            tx
          );

          if (!lockedFields.includes('genres')) {
            await GenreRepository.clearMovieGenres(movie.id, tx);
            for (const tmdbGenre of tmdbMovie.genres) {
              const genre = await GenreRepository.upsert(
                tmdbGenre.id,
                { name: tmdbGenre.name, slug: generateSlug(tmdbGenre.name), tmdbId: tmdbGenre.id },
                { name: tmdbGenre.name },
                tx
              );
              await GenreRepository.linkMovieGenre(movie.id, genre.id, tx);
            }
          }

          if (!lockedFields.includes('cast')) {
            await PersonRepository.clearMovieRole(movie.id, PersonRoleType.ACTOR, tx);
            const topCast = credits.cast.slice(0, 10);
            for (const castMember of topCast) {
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
                { name: castMember.name, headshotUrl },
                tx
              );
              await PersonRepository.linkMoviePerson(
                {
                  movieId: movie.id,
                  personId: person.id,
                  roleType: PersonRoleType.ACTOR,
                  characterName: castMember.character,
                  sortOrder: castMember.order,
                },
                tx
              );
            }
          }

          if (!lockedFields.includes('trailers')) {
            const trailers = videos.results.filter(
              (v) => v.site === 'YouTube' && v.type === 'Trailer'
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
