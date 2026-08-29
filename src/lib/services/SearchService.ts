import { searchMovies } from '../tmdb/api';
import { MovieRepository } from '../repositories/MovieRepository';
import { ExternalApiError } from '../errors';

export class SearchService {
  /**
   * Search external TMDB database directly.
   * ONLY for Admin CMS when finding new movies to import.
   */
  static async searchExternal(query: string, page = 1) {
    try {
      return await searchMovies(query, page);
    } catch (error: any) {
      throw new ExternalApiError(`Failed to search TMDB: ${error.message}`);
    }
  }

  /**
   * Search internal database for the public-facing website.
   * Reads from Prisma — no TMDB API calls.
   */
  static async searchInternal(query: string, page = 1, take = 24) {
    const skip = (page - 1) * take;
    const { data, total } = await MovieRepository.search({
      search: query || undefined,
      status: 'PUBLISHED',
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return { results: data, total_results: total, page, total_pages: Math.ceil(total / take) };
  }
}

