import { prisma } from '../prisma';

export class HealthService {
  static async checkDatabase() {
    return prisma.$queryRaw`SELECT 1`;
  }
}
