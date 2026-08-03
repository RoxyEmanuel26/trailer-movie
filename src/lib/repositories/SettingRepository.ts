import { Prisma, SettingType } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class SettingRepository {
  static async get(key: string, db: DbClient = prisma) {
    return db.setting.findUnique({
      where: { key },
    });
  }

  static async set(
    key: string,
    value: string,
    type: SettingType,
    group?: string,
    db: DbClient = prisma
  ) {
    return db.setting.upsert({
      where: { key },
      update: { value, type, group },
      create: { key, value, type, group },
    });
  }

  static async listByGroup(group: string, db: DbClient = prisma) {
    return db.setting.findMany({
      where: { group },
    });
  }
}
