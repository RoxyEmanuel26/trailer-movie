import {
  MovieRepository,
  PUBLIC_MOVIE_CARD_SELECT,
  type PublicMovieCardRecord,
} from '../repositories/MovieRepository';
import { NotFoundError, ValidationError } from '../errors';
import { cache } from 'react';
import { requireAdmin } from '../auth/utils';
import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';
import { moviePath, publicMovieSlug } from '../public-routes';
import { unstable_cache } from 'next/cache';
import { HOMEPAGE_CATALOG_TAG } from '../homepage-cache';

const RELATED_MOVIE_LIMIT = 8;

type SerializedPublicMovieCard = Omit<PublicMovieCardRecord, 'releaseDate'> & {
  releaseDate: string | null;
};

function serializeCard(movie: PublicMovieCardRecord): SerializedPublicMovieCard {
  return {
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : null,
    runtimeMinutes: movie.runtimeMinutes,
    mpaaRating: movie.mpaaRating,
    voteAverage: movie.voteAverage,
  };
}

function hydrateCard(movie: SerializedPublicMovieCard): PublicMovieCardRecord {
  return {
    ...movie,
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : null,
  };
}

const cachedCatalogStats = unstable_cache(
  (filters: Parameters<typeof MovieRepository.getCatalogStats>[0]) => MovieRepository.getCatalogStats(filters),
  ['public-catalog-statistics-v1'],
  { revalidate: 300, tags: [HOMEPAGE_CATALOG_TAG] },
);

const cachedRelatedMovies = unstable_cache(
  async (movieId: string, sortedGenreIds: string[]): Promise<SerializedPublicMovieCard[]> => {
    const selected: PublicMovieCardRecord[] = [];
    const excludeIds = new Set<string>([movieId]);

    try {
      const recs = await prisma.movieRecommendation.findMany({
        where: {
          sourceMovieId: movieId,
          targetMovie: { status: 'PUBLISHED', deletedAt: null },
        },
        orderBy: { sortOrder: 'asc' },
        take: RELATED_MOVIE_LIMIT,
        select: {
          targetMovie: {
            select: PUBLIC_MOVIE_CARD_SELECT,
          },
        },
      });

      for (const rec of recs) {
        if (!excludeIds.has(rec.targetMovie.id)) {
          selected.push(rec.targetMovie);
          excludeIds.add(rec.targetMovie.id);
        }
      }
    } catch {
      // Fall through to genre and recent/popular candidates if recommendations fail.
    }

    if (selected.length < RELATED_MOVIE_LIMIT && sortedGenreIds.length > 0) {
      const genreMatches = await MovieRepository.findRelatedCandidates({
        excludeIds: Array.from(excludeIds),
        genreIds: sortedGenreIds,
        take: RELATED_MOVIE_LIMIT - selected.length,
      });
      for (const movie of genreMatches) {
        if (!excludeIds.has(movie.id)) {
          selected.push(movie);
          excludeIds.add(movie.id);
          if (selected.length >= RELATED_MOVIE_LIMIT) break;
        }
      }
    }

    if (selected.length < RELATED_MOVIE_LIMIT) {
      const fallbackMatches = await MovieRepository.findRelatedCandidates({
        excludeIds: Array.from(excludeIds),
        take: RELATED_MOVIE_LIMIT - selected.length,
      });
      for (const movie of fallbackMatches) {
        if (!excludeIds.has(movie.id)) {
          selected.push(movie);
          excludeIds.add(movie.id);
          if (selected.length >= RELATED_MOVIE_LIMIT) break;
        }
      }
    }

    return selected.map(serializeCard);
  },
  ['public-related-movies-v2'],
  { revalidate: 3600, tags: [HOMEPAGE_CATALOG_TAG] },
);

export interface PublicCatalogPageQuery {
  page: number;
  itemsPerPage?: number;
  orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
  genreSlug?: string;
  collectionSlug?: string;
  tagSlug?: string;
  countryCodes?: string[];
  languageCodes?: string[];
  releaseYear?: number;
  latestReleasesOnly?: boolean;
}

const cachedPublicCatalogPage = unstable_cache(
  async (query: PublicCatalogPageQuery): Promise<{ total: number; data: SerializedPublicMovieCard[] }> => {
    const take = Math.min(Math.max(1, query.itemsPerPage || 24), 48);
    const skip = Math.max(0, (query.page - 1) * take);
    const { data, total } = await MovieRepository.searchPublicCards({
      skip,
      take,
      orderBy: query.orderBy,
      genreSlug: query.genreSlug,
      collectionSlug: query.collectionSlug,
      tagSlug: query.tagSlug,
      countryCodes: query.countryCodes,
      languageCodes: query.languageCodes,
      releaseYear: query.releaseYear,
      ...(query.latestReleasesOnly ? { releaseDateLte: new Date() } : {}),
    });
    return {
      total,
      data: data.map(serializeCard),
    };
  },
  ['public-catalog-pages-v2'],
  { revalidate: 300, tags: [HOMEPAGE_CATALOG_TAG] },
);

const cachedPublicTopRatedPage = unstable_cache(
  async (page: number, itemsPerPage: number): Promise<{ total: number; data: SerializedPublicMovieCard[] }> => {
    const take = Math.min(Math.max(1, itemsPerPage), 48);
    const skip = Math.max(0, (page - 1) * take);
    const { data, total } = await MovieRepository.searchTopRated({
      skip,
      take,
      minimumVotes: 50,
    });
    return {
      total,
      data: data.map(serializeCard),
    };
  },
  ['public-top-rated-pages-v2'],
  { revalidate: 300, tags: [HOMEPAGE_CATALOG_TAG] },
);

const dedupeCatalogPageInRequest = cache(async (serializedQuery: string) => {
  const query = JSON.parse(serializedQuery) as PublicCatalogPageQuery;
  const result = await cachedPublicCatalogPage(query);
  return {
    total: result.total,
    data: result.data.map(hydrateCard),
  };
});

const dedupeTopRatedPageInRequest = cache(async (page: number, itemsPerPage: number) => {
  const result = await cachedPublicTopRatedPage(page, itemsPerPage);
  return {
    total: result.total,
    data: result.data.map(hydrateCard),
  };
});

const dedupeRelatedMoviesInRequest = cache(async (movieId: string, genreKey: string) => {
  const genreIds = genreKey ? genreKey.split(',') : [];
  const items = await cachedRelatedMovies(movieId, genreIds);
  return items.map(hydrateCard);
});

export class MovieService {
  static getPopularHubCounts = cache(async () => MovieRepository.getPopularHubCounts());

  static countOriginGroups = cache(async (
    origins: Array<{ slug: string; countryCodes: string[]; languageCodes: string[] }>,
  ) => MovieRepository.countOriginGroups(origins));

  static listPublishedReleaseYears = cache(async () => {
    return MovieRepository.listPublishedReleaseYears();
  });

  static listPublishedReleaseYearStats = cache(async () => {
    return MovieRepository.listPublishedReleaseYearStats();
  });

  static getMovie = cache(async (id: string) => {
    const movie = await MovieRepository.findById(id);
    if (!movie || movie.status !== 'PUBLISHED') {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return movie;
  });

  static getBySlug = cache(async (slug: string) => {
    const movie = await MovieRepository.findBySlug(slug);
    if (!movie || movie.status !== 'PUBLISHED') {
      throw new NotFoundError(`Movie with slug ${slug} not found`);
    }
    return movie;
  });

  static getPublicMovie = cache(async (routeParam: string) => {
    const directMovie = await MovieRepository.findBySlug(routeParam);
    if (directMovie) {
      if (directMovie.status !== 'PUBLISHED') return null;
      return {
        movie: directMovie,
        canonicalPath: moviePath(directMovie.slug),
        shouldRedirect: publicMovieSlug(directMovie.slug) !== routeParam,
      };
    }

    const canonicalSlug = await MovieRepository.resolveCanonicalSlug(routeParam);
    if (!canonicalSlug) return null;
    try {
      const movie = await this.getBySlug(canonicalSlug);
      return {
        movie,
        canonicalPath: moviePath(movie.slug),
        shouldRedirect: publicMovieSlug(movie.slug) !== routeParam,
      };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  });

  static async getRelatedMovies(movieId: string, genreIds: string[]) {
    const sortedGenreIds = [...new Set(genreIds)].sort();
    return dedupeRelatedMoviesInRequest(movieId, sortedGenreIds.join(','));
  }

  static async getPublicCatalogPage(query: PublicCatalogPageQuery) {
    return dedupeCatalogPageInRequest(JSON.stringify(query));
  }

  static async getPublicTopRatedPage(page: number, itemsPerPage = 24) {
    return dedupeTopRatedPageInRequest(page, itemsPerPage);
  }

  static async publishMovie(id: string) {
    await requireAdmin('write:movies');
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
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }

    return MovieRepository.update(id, { status: 'ARCHIVED' });
  }

  static async deleteMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.delete(id);
  }

  static async updateMovie(id: string, data: any) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    return MovieRepository.update(id, data);
  }

  static async adminListMovies(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: any;
    orderBy?: any;
  }) {
    await requireAdmin('read:movies');
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 50, 100);
    const { data, total } = await MovieRepository.list({ ...params, skip, take });
    return {
      data,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  static async listMovies(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: any;
    orderBy?: any;
  }) {
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 50, 100);
    const { data, total } = await MovieRepository.list({
      ...params,
      skip,
      take,
      status: 'PUBLISHED',
    });
    return {
      data,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  static async searchMovies(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: any;
    orderBy?: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
    genreSlug?: string;
    collectionSlug?: string;
    tagSlug?: string;
    countryCodes?: string[];
    languageCodes?: string[];
    releaseYear?: number;
    releaseDateLte?: Date;
  }) {
    // Public search method that uses full-text search
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 24, 48);
    const { data, total } = await MovieRepository.search({
      ...params,
      skip,
      take,
      status: 'PUBLISHED',
    });
    return { data, total };
  }

  static async searchTopRatedMovies(params: { skip?: number; take?: number }) {
    const skip = Math.max(0, params.skip || 0);
    const take = Math.min(Number(params.take) || 24, 48);
    return MovieRepository.searchTopRated({ skip, take, minimumVotes: 50 });
  }

  static async getCatalogStats(filters: Parameters<typeof MovieRepository.getCatalogStats>[0]) {
    return cachedCatalogStats(filters);
  }
}
