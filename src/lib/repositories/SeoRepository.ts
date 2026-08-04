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
  static async listAllSeoPages(db: DbClient = prisma) {
    return db.seoPage.findMany({
      where: { inSitemap: true },
    });
  }
}
