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

/**
 * Fetches watch providers for a movie
 */
export async function getMovieWatchProviders(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/watch/providers`);
}

/**
 * Fetches movie reviews
 */
export async function getMovieReviews(id: number, page = 1): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/reviews`, { params: { language: 'en-US', page } });
}

/**
 * Fetches recommended movies
 */
export async function getMovieRecommendations(id: number, page = 1): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/recommendations`, { params: { language: 'en-US', page } });
}

/**
 * Fetches release dates and certifications
 */
export async function getMovieReleaseDates(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/release_dates`);
}

/**
 * Fetches movie keywords
 */
export async function getMovieKeywords(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/keywords`);
}

/**
 * Fetches collection details
 */
export async function getCollection(id: number): Promise<any> {
  return tmdbFetch<any>(`/collection/${id}`, { params: { language: 'en-US' } });
}

/**
 * Fetches movie extra info (budget, revenue, keywords, release dates, watch/providers, reviews)
 */
export async function getMovieExtra(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}`, { params: { language: 'en-US', append_to_response: 'keywords,release_dates,watch/providers,reviews,videos' } });
}

/**
 * Fetches movie images (posters, backdrops, logos)
 */
export async function getMovieImages(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/images`);
}

/**
 * Fetches movie alternative titles
 */
export async function getMovieAlternativeTitles(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}/alternative_titles`);
}

/**
 * Fetches movie with all enriched metadata in a single HTTP request (credits, videos, images, recommendations, alternative_titles, watch/providers, reviews, release_dates, keywords)
 */
export async function getMovieEnriched(id: number): Promise<any> {
  return tmdbFetch<any>(`/movie/${id}`, {
    params: {
      language: 'en-US',
      append_to_response: 'credits,videos,images,recommendations,alternative_titles,release_dates,watch/providers,reviews,keywords',
    },
  });
}

/**
 * Fetches combined credits for a person
 */
export async function getPersonCombinedCredits(id: number): Promise<any> {
  return tmdbFetch<any>(`/person/${id}/combined_credits`, { params: { language: 'en-US' } });
}

