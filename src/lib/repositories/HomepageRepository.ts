import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';
import { AnalyticsRepository } from './AnalyticsRepository';
import { chooseDailyHero, rankTrendingCandidates } from '../homepage-ranking';

const homepageMovieInclude = {
  genres: { include: { genre: true } },
  trailers: {
    where: { sourceType: 'YOUTUBE' as const, status: 'ACTIVE' as const },
    select: { id: true, sourceId: true },
    take: 1,
  },
} satisfies Prisma.MovieInclude;

const publicHomepageMovieWhere: Prisma.MovieWhereInput = {
  status: 'PUBLISHED',
  deletedAt: null,
  importQualityStatus: 'READY',
  posterUrl: { not: null },
  OR: [
    { youtubeTrailerId: { not: null } },
    { trailers: { some: { sourceType: 'YOUTUBE', status: 'ACTIVE' } } },
  ],
};

const SYSTEM_SECTION_KEYS = {
  trending: 'trending',
  latest: 'latest-releases',
  horror: 'latest-horror',
  drama: 'latest-drama',
  comedy: 'latest-comedy',
} as const;

function isEffectiveHomepageMovie(movie: any) {
  return movie?.status === 'PUBLISHED'
    && movie.deletedAt === null
    && movie.importQualityStatus === 'READY'
    && Boolean(movie.posterUrl)
    && Boolean(movie.youtubeTrailerId || movie.trailers?.length);
}

function takeUniqueMovies<T extends { id: string }>(movies: T[], seen: Set<string>, take = 6) {
  const result: T[] = [];
  for (const movie of movies) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    result.push(movie);
    if (result.length === take) break;
  }
  return result;
}

export class HomepageRepository {
  // ---------------------------------------------------------------------------
  // Homepage Sections
  // ---------------------------------------------------------------------------

  static async listSections(db: DbClient = prisma) {
    return db.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        collection: {
          select: { id: true, title: true, slug: true },
        },
        genre: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  static async ensureSystemSections(db: DbClient = prisma) {
    const genres = await db.genre.findMany({
      where: { slug: { in: ['horror', 'drama', 'comedy'] } },
      select: { id: true, slug: true },
    });
    const genreIds = new Map(genres.map((genre) => [genre.slug, genre.id]));
    const defaults = [
      { systemKey: SYSTEM_SECTION_KEYS.trending, title: 'Trending now', type: 'AUTO_TRENDING' as const, sortOrder: 10 },
      { systemKey: SYSTEM_SECTION_KEYS.latest, title: 'Latest releases', type: 'AUTO_RECENT' as const, sortOrder: 20 },
      { systemKey: SYSTEM_SECTION_KEYS.horror, title: 'Latest in Horror', type: 'GENRE_BASED' as const, sortOrder: 30, genreId: genreIds.get('horror') },
      { systemKey: SYSTEM_SECTION_KEYS.drama, title: 'Latest in Drama', type: 'GENRE_BASED' as const, sortOrder: 40, genreId: genreIds.get('drama') },
      { systemKey: SYSTEM_SECTION_KEYS.comedy, title: 'Latest in Comedy', type: 'GENRE_BASED' as const, sortOrder: 50, genreId: genreIds.get('comedy') },
    ];

    await Promise.all(defaults.map((section) => db.homepageSection.upsert({
      where: { systemKey: section.systemKey },
      update: section.genreId ? { genreId: section.genreId } : {},
      create: section,
    })));
  }

  static async getSection(id: string, db: DbClient = prisma) {
    return db.homepageSection.findUnique({
      where: { id },
      include: {
        collection: {
          select: { id: true, title: true, slug: true },
        },
        genre: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  static async createSection(data: Prisma.HomepageSectionUncheckedCreateInput, db: DbClient = prisma) {
    return db.homepageSection.create({ data });
  }

  static async updateSection(id: string, data: Prisma.HomepageSectionUncheckedUpdateInput, db: DbClient = prisma) {
    return db.homepageSection.update({
      where: { id },
      data,
    });
  }

  static async deleteSection(id: string, db: DbClient = prisma) {
    return db.homepageSection.delete({ where: { id } });
  }

  static async updateSectionOrder(updates: { id: string; sortOrder: number }[], db: DbClient = prisma) {
    const promises = updates.map((update) =>
      db.homepageSection.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder },
      })
    );
    return Promise.all(promises);
  }

  // ---------------------------------------------------------------------------
  // Featured Items
  // ---------------------------------------------------------------------------

  static async listFeaturedItems(db: DbClient = prisma) {
    return db.featuredItem.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            backdropUrl: true,
            posterUrl: true,
            releaseDate: true,
            status: true,
            deletedAt: true,
            importQualityStatus: true,
            youtubeTrailerId: true,
            synopsis: true,
            voteAverage: true,
            trailers: {
              where: { sourceType: 'YOUTUBE', status: 'ACTIVE' },
              select: { id: true, sourceId: true },
              take: 1,
            },
            genres: {
              include: { genre: true }
            }
          },
        },
      },
    });
  }

  static async getPublicDiscoveryData(db: DbClient = prisma) {
    const movieWhere = { status: 'PUBLISHED' as const, deletedAt: null };

    const [hero, totalMovies, trailersAvailable, genres] = await Promise.all([
      db.movie.findFirst({
        where: {
          ...movieWhere,
          backdropUrl: { not: null },
          youtubeTrailerId: { not: null },
        },
        orderBy: [{ popularity: 'desc' }, { voteCount: 'desc' }],
        include: { genres: { include: { genre: true } } },
      }),
      db.movie.count({ where: movieWhere }),
      db.movie.count({ where: { ...movieWhere, youtubeTrailerId: { not: null } } }),
      db.genre.findMany({
        orderBy: { movies: { _count: 'desc' } },
        take: 12,
        include: { _count: { select: { movies: true } } },
      }),
    ]);

    return { hero, totalMovies, trailersAvailable, genres };
  }

  static async getSmartHomepageData(db: DbClient = prisma) {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const releasedWhere: Prisma.MovieWhereInput = {
      AND: [publicHomepageMovieWhere, { releaseDate: { not: null, lte: now } }],
    };

    const [configuredSections, featuredItems, signals, systemGenres, popularCandidates, latestCandidates, browseGenres] = await Promise.all([
      this.listSections(db),
      this.listFeaturedItems(db),
      AnalyticsRepository.getHomepageEngagementSignals(sevenDaysAgo, db),
      db.genre.findMany({
        where: { slug: { in: ['horror', 'drama', 'comedy'] } },
        select: { id: true, name: true, slug: true },
      }),
      db.movie.findMany({
        where: releasedWhere,
        orderBy: [{ popularity: 'desc' }, { voteCount: 'desc' }],
        take: 240,
        include: homepageMovieInclude,
      }),
      db.movie.findMany({
        where: releasedWhere,
        orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
        take: 60,
        include: homepageMovieInclude,
      }),
      db.genre.findMany({
        where: { movies: { some: { movie: releasedWhere } } },
        include: {
          _count: { select: { movies: { where: { movie: releasedWhere } } } },
        },
      }),
    ]);

    const activeSignalIds = [...signals.keys()];
    const activeCandidates = activeSignalIds.length
      ? await db.movie.findMany({
          where: { AND: [releasedWhere, { id: { in: activeSignalIds } }] },
          include: homepageMovieInclude,
        })
      : [];
    const candidateMap = new Map([...popularCandidates, ...activeCandidates].map((movie) => [movie.id, movie]));
    const ranked = rankTrendingCandidates(
      [...candidateMap.values()].map((movie) => ({
        ...movie,
        views: signals.get(movie.id)?.views || 0,
        trailerPlays: signals.get(movie.id)?.trailerPlays || 0,
      })),
      now,
    );

    const configuredHero = featuredItems.find((item) =>
      item.isActive
      && isEffectiveHomepageMovie(item.movie)
      && (!item.startDate || item.startDate <= now)
      && (!item.endDate || item.endDate >= now),
    );
    const automaticHero = chooseDailyHero(ranked.filter((movie) => Boolean(movie.backdropUrl)), now);
    const hero = configuredHero?.movie || automaticHero || ranked[0] || latestCandidates[0] || null;

    const genresBySlug = new Map(systemGenres.map((genre) => [genre.slug, genre]));
    const genrePools = new Map<string, typeof latestCandidates>();
    await Promise.all(
      ['horror', 'drama', 'comedy'].map(async (slug) => {
        const genre = genresBySlug.get(slug);
        if (!genre) return;
        const movies = await db.movie.findMany({
          where: { AND: [releasedWhere, { genres: { some: { genreId: genre.id } } }] },
          orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
          take: 60,
          include: homepageMovieInclude,
        });
        genrePools.set(slug, movies);
      }),
    );

    const defaults = [
      { key: SYSTEM_SECTION_KEYS.trending, title: 'Trending now', type: 'AUTO_TRENDING' as const, sortOrder: 10, source: ranked, viewAllLink: '/popular/most-popular' },
      { key: SYSTEM_SECTION_KEYS.latest, title: 'Latest releases', type: 'AUTO_RECENT' as const, sortOrder: 20, source: latestCandidates, viewAllLink: '/popular/latest-releases' },
      { key: SYSTEM_SECTION_KEYS.horror, title: 'Latest in Horror', type: 'GENRE_BASED' as const, sortOrder: 30, source: genrePools.get('horror') || [], genre: genresBySlug.get('horror'), viewAllLink: '/genre/horror' },
      { key: SYSTEM_SECTION_KEYS.drama, title: 'Latest in Drama', type: 'GENRE_BASED' as const, sortOrder: 40, source: genrePools.get('drama') || [], genre: genresBySlug.get('drama'), viewAllLink: '/genre/drama' },
      { key: SYSTEM_SECTION_KEYS.comedy, title: 'Latest in Comedy', type: 'GENRE_BASED' as const, sortOrder: 50, source: genrePools.get('comedy') || [], genre: genresBySlug.get('comedy'), viewAllLink: '/genre/comedy' },
    ];
    const consumedSectionIds = new Set<string>();
    const resolveOverride = (definition: (typeof defaults)[number]) => {
      const match = configuredSections.find((section) => {
        if (section.systemKey === definition.key) return true;
        if (section.systemKey) return false;
        if (definition.key === SYSTEM_SECTION_KEYS.trending) return section.type === 'AUTO_TRENDING';
        if (definition.key === SYSTEM_SECTION_KEYS.latest) return section.type === 'AUTO_RECENT';
        return section.type === 'GENRE_BASED' && section.genre?.slug === definition.genre?.slug;
      });
      if (match) consumedSectionIds.add(match.id);
      return match;
    };

    const preparedDefinitions = defaults
      .map((definition) => ({ definition, override: resolveOverride(definition) }))
      .filter(({ override }) => override?.isActive !== false)
      .map(({ definition, override }) => ({
        ...definition,
        id: override?.id || `system-${definition.key}`,
        title: override?.title || definition.title,
        sortOrder: override?.sortOrder ?? definition.sortOrder,
        collectionId: override?.collectionId || null,
        genreId: override?.genreId || definition.genre?.id || null,
        collection: override?.collection || null,
      }));

    const customDefinitions = configuredSections
      .filter((section) => section.isActive && !consumedSectionIds.has(section.id))
      .map((section) => ({
        ...section,
        key: section.systemKey || `custom-${section.id}`,
        source: null,
        viewAllLink: '',
      }));
    const definitions = [...preparedDefinitions, ...customDefinitions].sort((left, right) => left.sortOrder - right.sortOrder);
    const seen = new Set<string>(hero ? [hero.id] : []);
    const sections = [];

    for (const definition of definitions) {
      let source = definition.source;
      let viewAllLink = definition.viewAllLink;
      if (!source) {
        const custom = await this.getSectionData(definition, db, 36);
        source = custom.movies.filter(isEffectiveHomepageMovie);
        viewAllLink = custom.viewAllLink;
      }
      const movies = takeUniqueMovies(source, seen, 6);
      if (movies.length) sections.push({ ...definition, movies, viewAllLink });
    }

    const genres = browseGenres
      .filter((genre) => genre._count.movies > 0)
      .sort((left, right) => right._count.movies - left._count.movies || left.name.localeCompare(right.name))
      .slice(0, 12);

    return {
      hero,
      heroHeadline: configuredHero?.customHeadline || hero?.title || null,
      heroBackdrop: configuredHero?.customBackdropUrl || hero?.backdropUrl || null,
      sections,
      genres,
      trending: sections.find((section) => section.key === SYSTEM_SECTION_KEYS.trending)?.movies || ranked.slice(0, 6),
    };
  }

  static async getFeaturedItem(id: string, db: DbClient = prisma) {
    return db.featuredItem.findUnique({
      where: { id },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            backdropUrl: true,
          },
        },
      },
    });
  }

  static async createFeaturedItem(data: Prisma.FeaturedItemUncheckedCreateInput, db: DbClient = prisma) {
    return db.featuredItem.create({ data });
  }

  static async updateFeaturedItem(id: string, data: Prisma.FeaturedItemUncheckedUpdateInput, db: DbClient = prisma) {
    return db.featuredItem.update({
      where: { id },
      data,
    });
  }

  static async deleteFeaturedItem(id: string, db: DbClient = prisma) {
    return db.featuredItem.delete({ where: { id } });
  }

  static async updateFeaturedItemOrder(updates: { id: string; sortOrder: number }[], db: DbClient = prisma) {
    const promises = updates.map((update) =>
      db.featuredItem.update({
        where: { id: update.id },
        data: { sortOrder: update.sortOrder },
      })
    );
    return Promise.all(promises);
  }

  // ---------------------------------------------------------------------------
  // UI Data Retrieval
  // ---------------------------------------------------------------------------

  static async getSectionData(section: any, db: DbClient = prisma, take = 6) {
    let movies: any[] = [];
    let viewAllLink = '';

    switch (section.type) {
      case 'AUTO_RECENT':
        const recent = await db.movie.findMany({
          where: {
            status: 'PUBLISHED',
            deletedAt: null,
            releaseDate: { not: null, lte: new Date() },
          },
          orderBy: [{ releaseDate: 'desc' }, { popularity: 'desc' }],
          take,
          include: { genres: { include: { genre: true } } }
        });
        movies = recent;
        viewAllLink = '/popular/latest-releases';
        break;

      case 'AUTO_UPCOMING':
        const upcoming = await db.movie.findMany({
          where: { status: 'PUBLISHED', releaseDate: { gt: new Date() }, deletedAt: null },
          orderBy: { releaseDate: 'asc' },
          take,
          include: { genres: { include: { genre: true } } }
        });
        movies = upcoming;
        viewAllLink = '/search?sort=releaseDate_asc';
        break;

      case 'AUTO_TRENDING':
        const trending = await db.movie.findMany({
          where: { status: 'PUBLISHED', deletedAt: null },
          orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
          take,
          include: { genres: { include: { genre: true } } }
        });
        movies = trending;
        viewAllLink = '/popular/most-popular';
        break;

      case 'MANUAL_COLLECTION':
        if (section.collectionId) {
          const collection = await db.collection.findUnique({
            where: { id: section.collectionId },
            include: {
              movies: {
                include: { movie: { include: { genres: { include: { genre: true } } } } },
                orderBy: { sortOrder: 'asc' },
                take,
              }
            }
          });
          if (collection) {
            movies = collection.movies.map(cm => cm.movie).filter(m => m.status === 'PUBLISHED' && m.deletedAt === null);
            viewAllLink = `/collection/${section.collection?.slug}`;
          }
        }
        break;

      case 'GENRE_BASED':
        if (section.genreId) {
          const genreMovies = await db.movie.findMany({
            where: {
              status: 'PUBLISHED',
              deletedAt: null,
              genres: { some: { genreId: section.genreId } }
            },
            orderBy: { releaseDate: 'desc' },
            take,
            include: { genres: { include: { genre: true } } }
          });
          movies = genreMovies;
          viewAllLink = `/genre/${section.genre?.slug}`;
        }
        break;
    }

    return { movies, viewAllLink };
  }
}
