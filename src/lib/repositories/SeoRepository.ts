import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class SeoRepository {
  static async getByRoute(routePath: string, db: DbClient = prisma) {
    return db.seoPage.findUnique({
      where: { routePath },
    });
  }

  static async getByEntity(seoableType: string, seoableId: string, db: DbClient = prisma) {
    return db.seoPage.findUnique({
      where: {
        seoableType_seoableId: { seoableType, seoableId },
      },
    });
  }

  static async upsertByRoute(routePath: string, data: Omit<Prisma.SeoPageCreateInput, 'routePath' | 'seoableType' | 'seoableId'>, db: DbClient = prisma) {
    return db.seoPage.upsert({
      where: { routePath },
      create: {
        routePath,
        seoableType: 'Page', // Fallback for route-based SEO
        seoableId: routePath,
        ...data,
      },
      update: data,
    });
  }

  static async upsertByEntity(
    seoableType: string,
    seoableId: string,
    data: Omit<Prisma.SeoPageCreateInput, 'seoableType' | 'seoableId'>,
    db: DbClient = prisma
  ) {
    return db.seoPage.upsert({
      where: {
        seoableType_seoableId: { seoableType, seoableId },
      },
      create: {
        seoableType,
        seoableId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Helper to find SEO data for a given entity or route, falling back to a default if not found.
   */
  static async findPageSEO(seoableType: string, seoableId: string, db: DbClient = prisma) {
    return db.seoPage.findUnique({
      where: {
        seoableType_seoableId: { seoableType, seoableId },
      },
    });
  }

  /**
   * Helper to list all SEO pages for sitemap generation (with inSitemap = true)
   */
  static async *listAllSeoPagesChunked(chunkSize: number = 5000, db: DbClient = prisma) {
    let cursor: string | undefined = undefined;
    while (true) {
      const chunk: Prisma.SeoPageGetPayload<Prisma.SeoPageDefaultArgs>[] = await db.seoPage.findMany({
        where: { inSitemap: true },
        take: chunkSize,
        skip: cursor ? 1 : 0,
        ...(cursor ? { cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });
      
      if (chunk.length === 0) break;
      
      yield chunk;
      cursor = chunk[chunk.length - 1].id;
    }
  }

  static async countIndexableMovies(db: DbClient = prisma) {
    return db.movie.count({
      where: { status: 'PUBLISHED', deletedAt: null, importQualityStatus: 'READY' },
    });
  }

  static async listIndexableMoviesForSitemap(
    params: { skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.movie.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, importQualityStatus: 'READY' },
      select: {
        slug: true,
        title: true,
        synopsis: true,
        posterUrl: true,
        updatedAt: true,
        youtubeTrailerId: true,
        trailers: {
          where: { status: 'ACTIVE', sourceType: 'YOUTUBE' },
          orderBy: [{ isPrimary: 'desc' }, { publishedDate: 'desc' }],
          take: 1,
          select: { sourceId: true, title: true, thumbnailUrl: true, publishedDate: true },
        },
      },
      orderBy: [{ slug: 'asc' }, { id: 'asc' }],
      skip: params.skip,
      take: params.take,
    });
  }

  static async getCoreSitemapData(db: DbClient = prisma) {
    const [genres, collections] = await Promise.all([
      db.genre.findMany({
        where: {
          description: { not: null },
          movies: { some: { movie: { status: 'PUBLISHED', deletedAt: null } } },
        },
        select: {
          slug: true,
          updatedAt: true,
          _count: {
            select: {
              movies: { where: { movie: { status: 'PUBLISHED', deletedAt: null } } },
            },
          },
        },
      }),
      db.collection.findMany({
        where: {
          isActive: true,
          description: { not: null },
          movies: { some: { movie: { status: 'PUBLISHED', deletedAt: null } } },
        },
        select: {
          slug: true,
          updatedAt: true,
          _count: {
            select: {
              movies: { where: { movie: { status: 'PUBLISHED', deletedAt: null } } },
            },
          },
        },
      }),
    ]);

    return {
      genres: genres.filter((genre) => genre._count.movies >= 3),
      collections: collections.filter((collection) => collection._count.movies >= 3),
    };
  }

  static async getRssFeedData(db: DbClient = prisma) {
    return db.movie.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, importQualityStatus: 'READY' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
