import type { TmdbMovie } from '../../types/tmdb';
import { MovieStatus } from '@prisma/client';
import slugify from 'slugify';

/**
 * Utility to generate slugs safely
 */
export function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true });
}

/**
 * Maps a TMDB Movie status to our internal Prisma MovieStatus
 */
export function mapTmdbStatus(status: string): MovieStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'released') return MovieStatus.PUBLISHED;
  if (normalized === 'post production' || normalized === 'planned') return MovieStatus.DRAFT;
  return MovieStatus.DRAFT;
}

/**
 * Maps TMDB Movie data to Prisma fields, explicitly omitting any locked fields.
 */
export function mapTmdbMovieToPrisma(tmdbMovie: TmdbMovie, lockedFields: string[] = []) {
  const mapped: Record<string, any> = {
    tmdbId: tmdbMovie.id,
  };

  // Helper to safely assign if not locked
  const assignIfNotLocked = (field: string, value: any) => {
    if (!lockedFields.includes(field)) {
      mapped[field] = value;
    }
  };

  assignIfNotLocked('title', tmdbMovie.title);
  assignIfNotLocked('originalTitle', tmdbMovie.original_title);

  if (tmdbMovie.title && !lockedFields.includes('slug')) {
    assignIfNotLocked('slug', `${generateSlug(tmdbMovie.title)}-${tmdbMovie.id}`);
  }

  assignIfNotLocked('synopsis', tmdbMovie.overview || null);

  if (tmdbMovie.release_date && !lockedFields.includes('releaseDate')) {
    // TMDB format is YYYY-MM-DD
    assignIfNotLocked('releaseDate', new Date(tmdbMovie.release_date));
  }

  assignIfNotLocked('runtimeMinutes', tmdbMovie.runtime || null);

  if (tmdbMovie.poster_path) {
    assignIfNotLocked('posterUrl', `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`);
  }

  if (tmdbMovie.backdrop_path) {
    assignIfNotLocked(
      'backdropUrl',
      `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}`
    );
  }

  assignIfNotLocked('status', mapTmdbStatus(tmdbMovie.status));

  return mapped;
}
