import { Prisma, SettingType } from '@prisma/client';
import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class SettingsRepository {
  /**
   * Fetch all settings for a given group.
   */
  static async getGroup(group: string, db: DbClient = prisma) {
    return db.setting.findMany({
      where: { group },
    });
  }

  /**
   * Fetch a single setting by key.
   */
  static async getByKey(key: string, db: DbClient = prisma) {
    return db.setting.findUnique({
      where: { key },
    });
  }

  /**
   * Upsert a setting.
   */
  static async upsert(
    key: string,
    value: string,
    type: SettingType = 'STRING',
    group: string | null = null,
    db: DbClient = prisma
  ) {
    return db.setting.upsert({
      where: { key },
      create: { key, value, type, group },
      update: { value, type, group },
    });
  }

  /**
   * Upsert multiple settings concurrently.
   */
  static async upsertMany(
    settings: { key: string; value: string; type?: SettingType; group?: string }[],
    db: DbClient = prisma
  ) {
    const promises = settings.map((s) =>
      this.upsert(s.key, s.value, s.type || 'STRING', s.group || null, db)
    );
    return Promise.all(promises);
  }
}
