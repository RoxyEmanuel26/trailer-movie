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

  // New enriched TMDB fields (Additive)
  if (typeof tmdbMovie.vote_average === 'number') {
    assignIfNotLocked('voteAverage', tmdbMovie.vote_average);
  }
  if (typeof tmdbMovie.vote_count === 'number') {
    assignIfNotLocked('voteCount', tmdbMovie.vote_count);
  }
  if (typeof tmdbMovie.popularity === 'number') {
    assignIfNotLocked('popularity', tmdbMovie.popularity);
  }
  if (tmdbMovie.tagline) {
    assignIfNotLocked('tagline', tmdbMovie.tagline);
  }
  if (tmdbMovie.original_language) {
    assignIfNotLocked('originalLanguage', tmdbMovie.original_language);
  }
  if (tmdbMovie.imdb_id) {
    assignIfNotLocked('imdbId', tmdbMovie.imdb_id);
  }
  if (tmdbMovie.homepage) {
    assignIfNotLocked('homepage', tmdbMovie.homepage);
  }
  if (tmdbMovie.status) {
    assignIfNotLocked('productionStatus', tmdbMovie.status);
  }
  if (typeof tmdbMovie.adult === 'boolean') {
    assignIfNotLocked('adult', tmdbMovie.adult);
  }

  // Extra fields
  const extra = tmdbMovie as any;
  if (extra.budget) assignIfNotLocked('budget', extra.budget);
  if (extra.revenue) assignIfNotLocked('revenue', extra.revenue);

  // Logo URL from images if present
  if (extra.images && extra.images.logos && Array.isArray(extra.images.logos) && extra.images.logos.length > 0) {
    const enLogo = extra.images.logos.find((l: any) => l.iso_639_1 === 'en') || extra.images.logos[0];
    if (enLogo && enLogo.file_path) {
      assignIfNotLocked('logoUrl', `https://image.tmdb.org/t/p/original${enLogo.file_path}`);
    }
  }
  
  if (extra.release_dates && extra.release_dates.results) {
    const usRelease = extra.release_dates.results.find((r: any) => r.iso_3166_1 === "US");
    if (usRelease && usRelease.release_dates && usRelease.release_dates.length > 0) {
      const cert = usRelease.release_dates.find((r: any) => r.certification !== "");
      if (cert) {
        assignIfNotLocked('ageRating', cert.certification);
        assignIfNotLocked('mpaaRating', cert.certification);
      }
    }
  }

  if (extra['watch/providers'] && extra['watch/providers'].results) {
    const usProviders = extra['watch/providers'].results.US || extra['watch/providers'].results.ID || null;
    if (usProviders) {
      assignIfNotLocked('watchProviders', usProviders);
    }
  }

  if (extra.reviews && extra.reviews.results) {
    assignIfNotLocked('reviews', extra.reviews.results);
  }

  return mapped;
}
