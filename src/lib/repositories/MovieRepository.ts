import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class MovieRepository {
  static async findById(id: string, db: DbClient = prisma) {
    return db.movie.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true } },
        trailers: true,
      },
    });
  }

  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.movie.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
        people: { include: { person: true }, orderBy: { sortOrder: 'asc' } },
        trailers: true,
        collections: { include: { collection: true } },
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
      },
    });
  }

  static async findByTmdbId(tmdbId: number, db: DbClient = prisma) {
    return db.movie.findUnique({
      where: { tmdbId },
    });
  }

  static async create(data: Prisma.MovieCreateInput, db: DbClient = prisma) {
    return db.movie.create({ data });
  }

  static async update(id: string, data: Prisma.MovieUpdateInput, db: DbClient = prisma) {
    return db.movie.update({ where: { id }, data });
  }

  static async upsert(
    tmdbId: number,
    create: Prisma.MovieCreateInput,
    update: Prisma.MovieUpdateInput,
    db: DbClient = prisma
  ) {
    return db.movie.upsert({
      where: { tmdbId },
      create,
      update,
    });
  }

  static async delete(id: string, db: DbClient = prisma) {
    // Soft delete per architecture
    return db.movie.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static async list(params: { 
    skip?: number; 
    take?: number; 
    search?: string; 
    status?: import('@prisma/client').MovieStatus; 
    orderBy?: { [key: string]: 'asc' | 'desc' };
    excludeId?: string;
  }, db: DbClient = prisma) {
    const where: Prisma.MovieWhereInput = { deletedAt: null };
    
    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }
    
    if (params.status) {
      where.status = params.status;
    }

    if (params.excludeId) {
      where.id = { not: params.excludeId };
    }

    const [data, total] = await prisma.$transaction([
      db.movie.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
        }
      }),
      db.movie.count({ where })
    ]);

    return { data, total };
  }
}
