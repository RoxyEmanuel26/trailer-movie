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
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { HOMEPAGE_CATALOG_TAG } from '../homepage-cache';
import { coreIndexNowPaths, submitIndexNowUrls } from '../indexnow';
import { clearAllPublicMemoryCaches, createMemoryCache } from '../memory-cache';
import { ImportQualityService } from './ImportQualityService';
import { extractYouTubeId } from '../utils/youtube';
import { ORIGIN_CATALOG } from '../public-catalog';
import { STREAMING_CATALOG } from '../streaming-catalog';
import {
  MIN_INDEXABLE_GUIDE_MOVIES,
  type IndexableFacetGuides,
} from '../programmatic-guides';

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
  providerTmdbIds?: number[];
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
      providerTmdbIds: query.providerTmdbIds,
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

const cachedStreamingGroupCounts = unstable_cache(
  async (platforms: Array<{ slug: string; tmdbIds: number[] }>) => {
    const map = await MovieRepository.countStreamingGroups(platforms);
    return Object.fromEntries(map.entries());
  },
  ['public-streaming-hub-counts-v1'],
  { revalidate: 600, tags: [HOMEPAGE_CATALOG_TAG] },
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

const publicCatalogPageCache = createMemoryCache<{ total: number; data: PublicMovieCardRecord[] }>({
  maxEntries: 500,
  ttlMs: 5 * 60_000,
});

const publicTopRatedPageCache = createMemoryCache<{ total: number; data: PublicMovieCardRecord[] }>({
  maxEntries: 100,
  ttlMs: 5 * 60_000,
});

const publicRelatedMoviesCache = createMemoryCache<PublicMovieCardRecord[]>({
  maxEntries: 1000,
  ttlMs: 30 * 60_000,
});

const publicCatalogStatsCache = createMemoryCache<Awaited<ReturnType<typeof MovieRepository.getCatalogStats>>>({
  maxEntries: 300,
  ttlMs: 10 * 60_000,
});

const publicSearchCache = createMemoryCache<{ data: PublicMovieCardRecord[]; total: number }>({
  maxEntries: 500,
  ttlMs: 5 * 60_000,
});

const dedupeCatalogPageInRequest = cache(async (serializedQuery: string) =>
  publicCatalogPageCache.getOrLoad(serializedQuery, async () => {
    const query = JSON.parse(serializedQuery) as PublicCatalogPageQuery;
    const result = await cachedPublicCatalogPage(query);
    return {
      total: result.total,
      data: result.data.map(hydrateCard),
    };
  })
);

const dedupeTopRatedPageInRequest = cache(async (page: number, itemsPerPage: number) =>
  publicTopRatedPageCache.getOrLoad(`${page}:${itemsPerPage}`, async () => {
    const result = await cachedPublicTopRatedPage(page, itemsPerPage);
    return {
      total: result.total,
      data: result.data.map(hydrateCard),
    };
  })
);

const dedupeRelatedMoviesInRequest = cache(async (movieId: string, genreKey: string) =>
  publicRelatedMoviesCache.getOrLoad(`${movieId}:${genreKey}`, async () => {
    const genreIds = genreKey ? genreKey.split(',') : [];
    const items = await cachedRelatedMovies(movieId, genreIds);
    return items.map(hydrateCard);
  })
);

const dedupeSearchInRequest = cache(async (serializedParams: string) =>
  publicSearchCache.getOrLoad(serializedParams, async () => {
    const params = JSON.parse(serializedParams);
    return MovieRepository.search({
      ...params,
      ...(params.releaseDateLte ? { releaseDateLte: new Date(params.releaseDateLte) } : {}),
      status: 'PUBLISHED',
    });
  })
);

type PublicMovieLookupResult = {
  movie: NonNullable<Awaited<ReturnType<typeof MovieRepository.findBySlug>>>;
  canonicalPath: string;
  shouldRedirect: boolean;
} | null;

const publicMovieCache = createMemoryCache<PublicMovieLookupResult>({
  maxEntries: 1500,
  ttlMs: 30 * 60_000,
});

const popularHubCountsCache = createMemoryCache<Awaited<ReturnType<typeof MovieRepository.getPopularHubCounts>>>({
  maxEntries: 2,
  ttlMs: 60 * 60_000,
});

const originGroupsCache = createMemoryCache<Map<string, number>>({
  maxEntries: 5,
  ttlMs: 60 * 60_000,
});

const releaseYearsCache = createMemoryCache<number[]>({
  maxEntries: 2,
  ttlMs: 60 * 60_000,
});

const releaseYearStatsCache = createMemoryCache<Awaited<ReturnType<typeof MovieRepository.listPublishedReleaseYearStats>>>({
  maxEntries: 2,
  ttlMs: 60 * 60_000,
});

const indexableFacetGuidesCache = createMemoryCache<IndexableFacetGuides>({
  maxEntries: 2,
  ttlMs: 60 * 60_000,
});

function notifyPublicCatalogMutation(slug?: string, submitToIndexNow = false) {
  clearAllPublicMemoryCaches();
  const detailPath = slug ? moviePath(slug) : undefined;
  try {
    revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
    revalidatePath('/');
    revalidatePath('/movies');
    revalidatePath('/streaming');
    revalidatePath('/feed.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/sitemaps', 'layout');
    if (detailPath) revalidatePath(detailPath);
  } catch {
    // Revalidation APIs require an active Next.js server store; ignore in CLI/tests.
  }
  if (submitToIndexNow && detailPath) {
    void submitIndexNowUrls([...coreIndexNowPaths(), detailPath]);
  }
}

export class MovieService {
  static getPopularHubCounts = cache(async () =>
    popularHubCountsCache.getOrLoad('popular-hub-counts', () => MovieRepository.getPopularHubCounts())
  );

  static countOriginGroups = cache(async (
    origins: Array<{ slug: string; countryCodes: string[]; languageCodes: string[] }>,
  ) =>
    originGroupsCache.getOrLoad(
      JSON.stringify(origins.map((o) => o.slug)),
      () => MovieRepository.countOriginGroups(origins),
    )
  );

  static countStreamingGroups = cache(async (
    platforms: Array<{ slug: string; tmdbIds: number[] }>,
  ) => {
    const entries = await cachedStreamingGroupCounts(platforms);
    return new Map(Object.entries(entries).map(([slug, count]) => [slug, Number(count)]));
  });

  static listPublishedReleaseYears = cache(async () =>
    releaseYearsCache.getOrLoad('release-years', () => MovieRepository.listPublishedReleaseYears())
  );

  static listPublishedReleaseYearStats = cache(async () =>
    releaseYearStatsCache.getOrLoad('release-year-stats', () => MovieRepository.listPublishedReleaseYearStats())
  );

  static getIndexableFacetGuides = cache(async () =>
    indexableFacetGuidesCache.getOrLoad('indexable-facet-guides', () =>
      MovieRepository.listIndexableFacetGuides({
        platforms: STREAMING_CATALOG.map(({ slug, tmdbIds }) => ({ slug, tmdbIds })),
        origins: ORIGIN_CATALOG.map(({ slug, countryCodes, languageCodes }) => ({
          slug,
          countryCodes,
          languageCodes,
        })),
        minCount: MIN_INDEXABLE_GUIDE_MOVIES,
      }),
    )
  );

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

  static getPublicMovie = cache(async (routeParam: string) =>
    publicMovieCache.getOrLoad(routeParam, async () => {
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
    })
  );

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

    const updated = await MovieRepository.update(id, { status: 'PUBLISHED' });
    await ImportQualityService.evaluate(id, prisma, { preserveStatus: true });
    notifyPublicCatalogMutation(updated.slug, true);
    return updated;
  }

  static async archiveMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }

    const updated = await MovieRepository.update(id, { status: 'ARCHIVED' });
    notifyPublicCatalogMutation(updated.slug, false);
    return updated;
  }

  static async deleteMovie(id: string) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }
    const deleted = await MovieRepository.delete(id);
    notifyPublicCatalogMutation(deleted.slug, false);
    return deleted;
  }

  static async updateMovie(id: string, data: any) {
    await requireAdmin('write:movies');
    const movie = await MovieRepository.findById(id);
    if (!movie) {
      throw new NotFoundError(`Movie with id ${id} not found`);
    }

    const updateData = { ...data };
    const hasTrailerUpdate = Object.prototype.hasOwnProperty.call(updateData, 'youtubeTrailerId');
    let normalizedYoutubeId: string | null | undefined = undefined;

    if (hasTrailerUpdate) {
      const rawTrailer = updateData.youtubeTrailerId;
      if (rawTrailer === null || (typeof rawTrailer === 'string' && rawTrailer.trim() === '')) {
        normalizedYoutubeId = null;
      } else if (typeof rawTrailer === 'string') {
        const extracted = extractYouTubeId(rawTrailer);
        if (!extracted) {
          throw new ValidationError('Invalid YouTube trailer URL or 11-character video ID');
        }
        normalizedYoutubeId = extracted;
      } else {
        throw new ValidationError('Invalid YouTube trailer ID');
      }
      updateData.youtubeTrailerId = normalizedYoutubeId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedMovie = await MovieRepository.update(id, updateData, tx);

      if (hasTrailerUpdate) {
        if (normalizedYoutubeId) {
          await tx.trailer.updateMany({
            where: {
              movieId: id,
              sourceType: 'YOUTUBE',
              sourceId: { not: normalizedYoutubeId },
            },
            data: {
              isPrimary: false,
              status: 'INACTIVE',
            },
          });

          await tx.trailer.upsert({
            where: {
              movieId_sourceId: {
                movieId: id,
                sourceId: normalizedYoutubeId,
              },
            },
            update: {
              sourceType: 'YOUTUBE',
              isPrimary: true,
              status: 'ACTIVE',
              dataSource: 'MANUAL',
              thumbnailUrl: `https://i.ytimg.com/vi/${normalizedYoutubeId}/hqdefault.jpg`,
            },
            create: {
              movieId: id,
              title: `${updatedMovie.title} Official Trailer`,
              sourceType: 'YOUTUBE',
              sourceId: normalizedYoutubeId,
              videoType: 'TRAILER',
              isPrimary: true,
              status: 'ACTIVE',
              dataSource: 'MANUAL',
              thumbnailUrl: `https://i.ytimg.com/vi/${normalizedYoutubeId}/hqdefault.jpg`,
            },
          });
        } else {
          await tx.trailer.updateMany({
            where: {
              movieId: id,
              sourceType: 'YOUTUBE',
            },
            data: {
              isPrimary: false,
              status: 'INACTIVE',
            },
          });
        }
      }

      return updatedMovie;
    });

    await ImportQualityService.evaluate(id, prisma, { preserveStatus: true });
    notifyPublicCatalogMutation(updated.slug, updated.status === 'PUBLISHED');
    return updated;
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
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 24, 48);
    return dedupeSearchInRequest(
      JSON.stringify({
        ...params,
        skip,
        take,
      }),
    );
  }

  static async searchTopRatedMovies(params: { skip?: number; take?: number }) {
    const skip = Math.max(0, params.skip || 0);
    const take = Math.min(Number(params.take) || 24, 48);
    return MovieRepository.searchTopRated({ skip, take, minimumVotes: 50 });
  }

  static async getCatalogStats(filters: Parameters<typeof MovieRepository.getCatalogStats>[0]) {
    const key = JSON.stringify(filters);
    return publicCatalogStatsCache.getOrLoad(key, () => cachedCatalogStats(filters));
  }
}
