import { MovieRepository } from '../repositories/MovieRepository';
import { NotFoundError, ValidationError } from '../errors';
import { cache } from 'react';
import { requireAdmin } from '../auth/utils';

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
    if (genreIds && genreIds.length > 0) {
      const { data } = await MovieRepository.search({
        status: 'PUBLISHED',
        take: 5,
        excludeId: movieId,
        genreIds,
      });
      if (data.length > 0) return data;
    }
    // Fallback: return recently added movies if no genre match
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
