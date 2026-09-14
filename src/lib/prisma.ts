import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import WebSocket from 'ws';

// Neon needs a WebSocket implementation in bare Node.js processes such as tsx scripts.
neonConfig.webSocketConstructor = WebSocket;

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
