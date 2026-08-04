import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

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
            backdropUrl: true,
            posterUrl: true,
            releaseDate: true,
            status: true,
            genres: {
              include: { genre: true }
            }
          },
        },
      },
    });
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
}
