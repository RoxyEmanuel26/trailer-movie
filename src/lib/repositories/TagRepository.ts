import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class TagRepository {
  static async list(db: DbClient = prisma) {
    return db.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: string, db: DbClient = prisma) {
    return db.tag.findUnique({
      where: { id },
    });
  }

  static async findBySlug(slug: string, db: DbClient = prisma) {
    return db.tag.findUnique({
      where: { slug },
    });
  }

  static async create(data: Prisma.TagCreateInput, db: DbClient = prisma) {
    return db.tag.create({ data });
  }

  static async update(id: string, data: Prisma.TagUpdateInput, db: DbClient = prisma) {
    return db.tag.update({ where: { id }, data });
  }

  static async delete(id: string, db: DbClient = prisma) {
    return db.tag.delete({ where: { id } });
  }

  static async deleteMany(ids: string[], db: DbClient = prisma) {
    return db.tag.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
