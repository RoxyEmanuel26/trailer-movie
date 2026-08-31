import { TmdbError, TmdbRateLimitError } from './errors';
import { secureFetch } from '../security/fetcher';
import { logger } from '../logger';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  retries?: number;
}

const DEFAULT_RETRIES = 15;
const TIMEOUT_MS = 10000;

export async function tmdbFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  const baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

  if (!token) {
    throw new Error('TMDB_ACCESS_TOKEN is not defined in environment variables');
  }

  const { params, retries = DEFAULT_RETRIES, ...customConfig } = options;

  // Build URL with query params
  const url = new URL(`${baseUrl}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      ...customConfig.headers,
    },
  };

  try {
    const response = await secureFetch(url.toString(), {
      ...config,
      timeoutMs: TIMEOUT_MS,
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '1', 10);
        if (retries > 0) {
          logger.warn(
            `TMDB Rate limited. Retrying after ${retryAfter}s... (${retries} retries left)`
          );
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return tmdbFetch<T>(endpoint, { ...options, retries: retries - 1 });
        }
        throw new TmdbRateLimitError(retryAfter);
      }

      // Handle 5xx errors with standard exponential backoff
      if (response.status >= 500 && retries > 0) {
        const backoff = (DEFAULT_RETRIES - retries + 1) * 1000; // 1s, 2s, 3s
        logger.warn(`TMDB Server Error ${response.status}. Retrying in ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return tmdbFetch<T>(endpoint, { ...options, retries: retries - 1 });
      }

      // Parse error body if possible
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.status_message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText;
      }

      throw new TmdbError(response.status, errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`TMDB API request timed out after ${TIMEOUT_MS}ms`);
    }
    throw error;
  }
}
