import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class CollectionRepository {
  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.collection.findUnique({
      where: { slug },
      include: {
        movies: {
          include: { movie: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  static async listActive(db: DbClient = prisma) {
    return db.collection.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  static async listAll(db: DbClient = prisma) {
    return db.collection.findMany({
      orderBy: { title: 'asc' },
    });
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.collection.findUnique({
      where: { id },
      include: {
        movies: {
          include: { movie: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  static async create(data: Prisma.CollectionCreateInput, db: DbClient = prisma) {
    return db.collection.create({ data });
  }

  static async update(id: string, data: Prisma.CollectionUpdateInput, db: DbClient = prisma) {
    return db.collection.update({ where: { id }, data });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.collection.delete({ where: { id } });
  }

  static async deleteMany(ids: string[], db: DbClient = prisma) {
    return db.collection.deleteMany({
      where: { id: { in: ids } },
    });
  }

  static async updateStatus(ids: string[], isActive: boolean, db: DbClient = prisma) {
    return db.collection.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
  }

  static async updateFeatured(ids: string[], isFeatured: boolean, db: DbClient = prisma) {
    return db.collection.updateMany({
      where: { id: { in: ids } },
      data: { isFeatured },
    });
  }

  // Movie assignments
  static async replaceMovies(collectionId: string, movieIds: string[], db: DbClient = prisma) {
    // If db is already a transaction client, we just execute on it.
    // In Prisma, nested transactions require the interactive transaction client ($transaction).
    // To be safe, if `db` has `$transaction`, use it. Otherwise, assume it's already inside one.
    const run = async (tx: any) => {
      await tx.collectionMovie.deleteMany({ where: { collectionId } });
      
      if (movieIds.length > 0) {
        const createData = movieIds.map((movieId, index) => ({
          collectionId,
          movieId,
          sortOrder: index,
        }));
        await tx.collectionMovie.createMany({ data: createData });
      }
      return tx.collection.findUnique({
        where: { id: collectionId },
        include: {
          movies: {
            include: { movie: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    };

    if ('$transaction' in db) {
      return (db as any).$transaction(run);
    }
    
    return run(db);
  }
}
