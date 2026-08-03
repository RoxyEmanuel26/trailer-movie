import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class UserRepository {
  static async findById(id: string, db: DbClient = prisma) {
    return db.user.findUnique({
      where: { id },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
  }

  static async findByEmail(email: string, db: DbClient = prisma) {
    return db.user.findUnique({
      where: { email },
    });
  }
}
