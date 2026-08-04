import { MovieRepository } from '../repositories/MovieRepository';
import { NotFoundError, ValidationError } from '../errors';

export class MovieService {
  static async getMovie(id: string) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return movie;
  }

  static async publishMovie(id: string) {
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
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }

    return MovieRepository.update(id, { status: 'ARCHIVED' });
  }

  static async deleteMovie(id: string) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.delete(id);
  }

  static async updateMovie(id: string, data: any) {
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.update(id, data);
  }

  static async listMovies(params: { 
    skip?: number; 
    take?: number; 
    search?: string; 
    status?: any; 
    orderBy?: any 
  }) {
    const skip = params.skip || 0;
    const take = params.take || 50;
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
}
