import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class TransactionManager {
  static async run<T>(
    fn: (tx: DbClient) => Promise<T>,
    options?: { timeout?: number }
  ): Promise<T> {
    return prisma.$transaction(fn, options);
  }
}
