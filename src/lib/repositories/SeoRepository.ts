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

  static async getSitemapData(db: DbClient = prisma) {
    const [movies, genres, collections] = await Promise.all([
      db.movie.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true }, take: 1000 }),
      db.genre.findMany({ select: { slug: true, updatedAt: true }, take: 100 }),
      db.collection.findMany({ where: { isActive: true }, select: { slug: true }, take: 100 }),
    ]);

    return { movies, genres, collections };
  }

  static async getRssFeedData(db: DbClient = prisma) {
    return db.movie.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
