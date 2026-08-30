import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
// In bare Node.js environments (like tsx scripts), we might need the 'ws' polyfill.
// We use a dynamic check and require to prevent Next.js Edge bundlers from complaining.
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  try {
    // @ts-ignore
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
  } catch (e) {
    // Ignore if not found
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL is safe
const connectionString = process.env.DATABASE_URL || '';

const poolConfig = {
  connectionString,
};

const adapter = new PrismaNeon(poolConfig);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
