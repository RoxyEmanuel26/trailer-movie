import { MovieRepository } from '../repositories/MovieRepository';
import { NotFoundError, ValidationError } from '../errors';
import { cache } from 'react';
import { requireAdmin } from '../auth/utils';
import { prisma } from '../prisma';

export class MovieService {
  static getMovie = cache(async (id: string) => {
    const movie = await MovieRepository.findById(id);
    if (!movie || movie.status !== 'PUBLISHED') {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return movie;
  });

  static getBySlug = cache(async (slug: string) => {
    const movie = await MovieRepository.findBySlug(slug);
    if (!movie || movie.status !== 'PUBLISHED') {
      throw new NotFoundError(`Movie with slug ${slug} not found`);
    }
    return movie;
  });

  static async getRelatedMovies(movieId: string, genreIds: string[]) {
    // 1. Primary: Curated TMDB recommendations from local DB
    try {
      const recs = await prisma.movieRecommendation.findMany({
        where: {
          sourceMovieId: movieId,
          targetMovie: { status: 'PUBLISHED', deletedAt: null },
        },
        orderBy: { sortOrder: 'asc' },
        take: 5,
        include: {
          targetMovie: {
            include: {
              genres: { include: { genre: true } },
            },
          },
        },
      });

      const recommendedMovies = recs.map((r) => r.targetMovie);
      if (recommendedMovies.length >= 5) {
        return recommendedMovies;
      }

      // If we have fewer than 5 curated recommendations, supplement with genre matches
      const excludeIds = new Set([movieId, ...recommendedMovies.map((m) => m.id)]);
      const needed = 5 - recommendedMovies.length;

      if (genreIds && genreIds.length > 0) {
        const { data } = await MovieRepository.search({
          status: 'PUBLISHED',
          take: needed + 3,
          excludeId: movieId,
          genreIds,
        });
        for (const m of data) {
          if (!excludeIds.has(m.id)) {
            recommendedMovies.push(m);
            excludeIds.add(m.id);
            if (recommendedMovies.length >= 5) break;
          }
        }
      }

      if (recommendedMovies.length < 5) {
        const { data } = await MovieRepository.list({
          status: 'PUBLISHED',
          take: 5 - recommendedMovies.length + 3,
          excludeId: movieId,
        });
        for (const m of data) {
          if (!excludeIds.has(m.id)) {
            recommendedMovies.push(m);
            excludeIds.add(m.id);
            if (recommendedMovies.length >= 5) break;
          }
        }
      }

      return recommendedMovies;
    } catch (e) {
      // Fallback silently if table query encounters any issue
    }

    // 2. Secondary: Same-genre matches
    if (genreIds && genreIds.length > 0) {
      const { data } = await MovieRepository.search({
        status: 'PUBLISHED',
        take: 5,
        excludeId: movieId,
        genreIds,
      });
      if (data.length > 0) return data;
    }

    // 3. Fallback: Recently added movies
    const { data } = await MovieRepository.list({
      status: 'PUBLISHED',
      take: 5,
      excludeId: movieId,
    });
    return data;
  }

  static async publishMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    if (movie.status === 'PUBLISHED') {
      throw new ValidationError(`Movie with id ${id} is already published`);
    }

    return MovieRepository.update(id, { status: 'PUBLISHED' });
  }

  static async archiveMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }

    return MovieRepository.update(id, { status: 'ARCHIVED' });
  }

  static async deleteMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.delete(id);
  }

  static async updateMovie(id: string, data: any) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.update(id, data);
  }

  static async adminListMovies(params: { 
    skip?: number; 
    take?: number; 
    search?: string; 
    status?: any; 
    orderBy?: any 
  }) {
    await requireAdmin('read:movies');
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 50, 100);
    const { data, total } = await MovieRepository.list({ ...params, skip, take });
    return {
      data,
      meta: {
        total,
        skip,
        take,
      }
    };
  }

  static async listMovies(params: { 
    skip?: number; 
    take?: number; 
    search?: string; 
    status?: any; 
    orderBy?: any 
  }) {
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 50, 100);
    const { data, total } = await MovieRepository.list({ ...params, skip, take, status: 'PUBLISHED' });
    return {
      data,
      meta: {
        total,
        skip,
        take,
      }
    };
  }

  static async searchMovies(params: { 
    skip?: number; 
    take?: number; 
    search?: string; 
    status?: any; 
    orderBy?: any;
    genreSlug?: string;
    collectionSlug?: string;
    tagSlug?: string;
  }) {
    // Public search method that uses full-text search
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 24, 48);
    const { data, total } = await MovieRepository.search({ ...params, skip, take, status: 'PUBLISHED' });
    return { data, total };
  }
}
