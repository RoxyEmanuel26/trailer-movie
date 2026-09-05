import { prisma } from '../prisma';
import { DbClient } from './base.types';

export class TransactionManager {
  static async run<T>(
    fn: (tx: DbClient) => Promise<T>,
    options?: { timeout?: number, maxWait?: number }
  ): Promise<T> {
    const finalOptions = {
      maxWait: options?.maxWait || 15000,
      timeout: options?.timeout || 120000,
    };
    return prisma.$transaction(fn, finalOptions);
  }
}
