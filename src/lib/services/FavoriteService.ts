import { FavoriteRepository } from '../repositories/FavoriteRepository';
import { MovieRepository } from '../repositories/MovieRepository';
import { UserRepository } from '../repositories/UserRepository';
import { NotFoundError, ConflictError } from '../errors';

export class FavoriteService {
  static async addFavorite(userId: string, movieId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const movie = await MovieRepository.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    try {
      return await FavoriteRepository.create(userId, movieId);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('Movie is already in favorites');
      }
      throw error;
    }
  }

  static async removeFavorite(userId: string, movieId: string) {
    try {
      return await FavoriteRepository.delete(userId, movieId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Favorite not found');
      }
      throw error;
    }
  }

  static async getUserFavorites(userId: string) {
    return FavoriteRepository.listByUser(userId);
  }
}
