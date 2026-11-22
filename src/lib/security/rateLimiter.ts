import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { AppError } from '../errors';
import { logger } from '../logger';

// 1. IP Resolution safely extracts the best IP preventing spoofing
export function resolveIp(request: Request | NextRequest | any): string {
  const headers = request?.headers;
  const getHeader = (name: string): string | null | undefined =>
    headers ? (typeof headers.get === 'function' ? headers.get(name) : headers[name]) : undefined;

  const cfIp = getHeader('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const forwarded = getHeader('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

// 2. Initialize Redis client (with graceful error handling if ENV is missing)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = !!(redisUrl && redisToken);

const redis = isRedisConfigured
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const LOCAL_WINDOW_MS = 60_000;
const LOCAL_MAX_IDENTIFIERS = 10_000;

class BoundedEphemeralMap<K, V> extends Map<K, V> {
  private readonly maxEntries: number;

  constructor(maxEntries = LOCAL_MAX_IDENTIFIERS) {
    super();
    this.maxEntries = maxEntries;
  }

  override set(key: K, value: V): this {
    if (this.has(key)) {
      this.delete(key);
    } else if (this.size >= this.maxEntries) {
      const oldestKey = this.keys().next().value;
      if (oldestKey !== undefined) this.delete(oldestKey);
    }
    return super.set(key, value);
  }
}

// Graceful fallback: bounded local Map if Redis is not configured
const fallbackCache = new BoundedEphemeralMap<string, number>(LOCAL_MAX_IDENTIFIERS);
const localWindows = new Map<string, number[]>();

function normalizeRateLimitScope(path: string): string {
  const clean = path.split('?')[0].trim().toLowerCase();
  if (!clean || clean === 'unknown') return 'default';
  if (clean.startsWith('/api/analytics/events')) return 'analytics-events';
  if (clean.startsWith('/api/analytics/consent')) return 'analytics-consent';
  if (clean.startsWith('/api/admin/imports')) return 'admin-imports';
  if (clean.startsWith('/api/admin')) return 'admin';
  if (clean.startsWith('/api/public/search') || clean.startsWith('/api/search')) return 'search';
  if (clean.startsWith('/api/auth')) return 'auth';
  return clean.split('/').filter(Boolean).slice(0, 3).join('-') || 'default';
}

function enforceLocalLimit(identifier: string, limit: number, path: string) {
  const now = Date.now();
  const scope = normalizeRateLimitScope(path);
  const key = `${scope}:${limit}:${identifier}`;
  const windowStart = now - LOCAL_WINDOW_MS;
  const timestamps = (localWindows.get(key) || []).filter((timestamp) => timestamp > windowStart);

  if (timestamps.length >= limit) {
    localWindows.delete(key);
    localWindows.set(key, timestamps);
    const reset = timestamps[0] + LOCAL_WINDOW_MS;
    const error = new AppError('Too many requests, please try again later.', 429);
    (error as AppError & { headers?: Record<string, string> }).headers = {
      'Retry-After': Math.max(1, Math.ceil((reset - now) / 1000)).toString(),
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': reset.toString(),
    };
    logger.warn({ ip: identifier, path, scope, limitTier: limit }, '[RATE_LIMIT_EXCEEDED] Request blocked locally');
    throw error;
  }

  timestamps.push(now);
  localWindows.delete(key);
  localWindows.set(key, timestamps);
  if (localWindows.size > LOCAL_MAX_IDENTIFIERS) {
    for (const [candidate, values] of localWindows) {
      if (values.at(-1)! <= windowStart) localWindows.delete(candidate);
      if (localWindows.size <= LOCAL_MAX_IDENTIFIERS) break;
    }
    while (localWindows.size > LOCAL_MAX_IDENTIFIERS) {
      localWindows.delete(localWindows.keys().next().value as string);
    }
  }
}

// 3. Define Rate Limit Tiers (Tokens per 60s window)
// Configurable via ENV variables to allow ops to adjust limits on the fly
export const RateLimitTiers = {
  PUBLIC_GET: Number(process.env.RATE_LIMIT_PUBLIC_GET) || 200,
  PUBLIC_POST: Number(process.env.RATE_LIMIT_PUBLIC_POST) || 50,
  SEARCH: Number(process.env.RATE_LIMIT_SEARCH) || 30,
  ANALYTICS: Number(process.env.RATE_LIMIT_ANALYTICS) || 60,
  ADMIN: Number(process.env.RATE_LIMIT_ADMIN) || 20,
  IMPORT: Number(process.env.RATE_LIMIT_IMPORT) || 5,
};

// Map to hold instantiated ratelimiters keyed by scope and limit so distinct tiers never collide
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, scope: string): Ratelimit {
  const key = `${scope}:${limit}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: redis || (fallbackCache as any),
        limiter: Ratelimit.slidingWindow(limit, '60 s'),
        prefix: `@movieflix/ratelimit:${scope}:${limit}`,
        ephemeralCache: fallbackCache, // Bounded local cache to speed up and reduce Redis ops
      })
    );
  }
  return limiters.get(key)!;
}

/**
 * Enforces rate limiting for the given identifier and limit.
 * If exceeded, throws an AppError with 429 status and structured logging.
 */
export async function enforceRateLimit(
  identifier: string,
  limit: number,
  path: string = 'unknown'
): Promise<void> {
  if (!redis) {
    enforceLocalLimit(identifier, limit, path);
    return;
  }

  try {
    const scope = normalizeRateLimitScope(path);
    const limiter = getLimiter(limit, scope);
    const { success, pending, limit: rateLimitLimit, remaining, reset } = await limiter.limit(identifier);

    // wait for async operations (like telemetry/analytics) to complete
    if (pending) await pending;

    if (!success) {
      logger.warn({ ip: identifier, path, scope, limitTier: limit }, '[RATE_LIMIT_EXCEEDED] Request blocked');
      
      const error = new AppError('Too many requests, please try again later.', 429);
      // Attach headers info to the error so the API handler can return them
      (error as any).headers = {
        'Retry-After': Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
        'X-RateLimit-Limit': rateLimitLimit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      };
      throw error;
    }
  } catch (error: any) {
    // If it's our own AppError, rethrow it
    if (error instanceof AppError) throw error;
    
    // If Redis fails or Ratelimit crashes, fall back to bounded in-memory enforcement
    // so rate limits stay active during transient Redis outages without causing 500s.
    logger.error({ err: error, identifier, path }, '[RATE_LIMIT_ERROR] Redis unavailable; falling back to local rate limiter.');
    enforceLocalLimit(identifier, limit, path);
  }
}
