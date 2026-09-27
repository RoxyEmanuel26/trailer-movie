import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import WebSocket from 'ws';

// Neon needs a WebSocket implementation in bare Node.js processes such as tsx scripts.
neonConfig.webSocketConstructor = WebSocket;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL || '';
const driver = process.env.DATABASE_DRIVER || 'neon';

if (driver !== 'neon' && driver !== 'pg') {
  throw new Error('DATABASE_DRIVER must be neon or pg');
}

function postgresAdapter() {
  const url = new URL(connectionString);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const sslmode = url.searchParams.get('sslmode');
  const insecureOverride = process.env.ALLOW_INSECURE_POSTGRES === 'true' && sslmode === 'disable';
  if (!isLocal && sslmode !== 'verify-full' && !insecureOverride) {
    throw new Error('Remote PostgreSQL requires sslmode=verify-full, or an explicit ALLOW_INSECURE_POSTGRES=true override with sslmode=disable');
  }
  if (!isLocal && insecureOverride) {
    console.warn('WARNING: PostgreSQL connection is unencrypted. Credentials and data may be exposed in transit.');
  }

  const configuredMax = Number(process.env.DB_POOL_MAX);
  const max = Number.isSafeInteger(configuredMax) && configuredMax > 0 && configuredMax <= 20
    ? configuredMax
    : process.env.IMPORT_EXECUTION_MODE === 'local' ? 12 : 1;

  return new PrismaPg({
    connectionString,
    max,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 10_000,
  });
}

function createPrismaClient() {
  const adapter = driver === 'pg'
    ? postgresAdapter()
    : new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the same pool in development, production runtimes, and Next.js build
// workers. Creating the adapter before this cache check leaked an unused pool
// for every route bundle during prerendering.
globalForPrisma.prisma = prisma;
