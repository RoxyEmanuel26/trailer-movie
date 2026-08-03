import { tmdbFetch } from './client';
import type {
  TmdbMovie,
  TmdbCredits,
  TmdbVideos,
  TmdbPerson,
  TmdbSearchResponse,
} from '../../types/tmdb';

/**
 * Fetches core movie details by TMDB ID
 */
export async function getMovie(id: number): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/movie/${id}`, {
    params: {
      language: 'en-US',
    },
  });
}

/**
 * Fetches movie cast and crew by TMDB ID
 */
export async function getMovieCredits(id: number): Promise<TmdbCredits> {
  return tmdbFetch<TmdbCredits>(`/movie/${id}/credits`, {
    params: {
      language: 'en-US',
    },
  });
}

/**
 * Fetches available videos (trailers, clips) for a movie
 */
export async function getMovieVideos(id: number): Promise<TmdbVideos> {
  return tmdbFetch<TmdbVideos>(`/movie/${id}/videos`, {
    params: {
      language: 'en-US',
    },
  });
}

/**
 * Fetches person (actor, director) details
 */
export async function getPerson(id: number): Promise<TmdbPerson> {
  return tmdbFetch<TmdbPerson>(`/person/${id}`, {
    params: {
      language: 'en-US',
    },
  });
}

/**
 * Search movies by text query
 */
export async function searchMovies(
  query: string,
  page = 1
): Promise<TmdbSearchResponse<TmdbMovie>> {
  return tmdbFetch<TmdbSearchResponse<TmdbMovie>>(`/search/movie`, {
    params: {
      query,
      page,
      language: 'en-US',
      include_adult: false,
    },
  });
}
