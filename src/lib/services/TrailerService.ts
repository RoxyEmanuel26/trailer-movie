import { TrailerRepository } from '../repositories/TrailerRepository';
import { MovieRepository } from '../repositories/MovieRepository';
import { NotFoundError, ValidationError } from '../errors';

export class TrailerService {
  static async getActiveTrailers(movieId: string) {
    const movie = await MovieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${movieId} not found`);
    }

    return TrailerRepository.findActiveByMovie(movieId);
  }
}
