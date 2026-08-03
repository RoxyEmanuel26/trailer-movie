import { searchMovies } from '../tmdb/api';
import { ExternalApiError } from '../errors';

export class SearchService {
  /**
   * Search external TMDB database directly (useful for the Admin CMS when finding new movies to import).
   */
  static async searchExternal(query: string, page = 1) {
    try {
      return await searchMovies(query, page);
    } catch (error: any) {
      throw new ExternalApiError(`Failed to search TMDB: ${error.message}`);
    }
  }

  // Future: Internal search for public UI
}
