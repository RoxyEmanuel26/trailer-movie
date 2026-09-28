import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { AppError } from '../errors';
import { logger } from '../logger';

// 1. IP Resolution safely extracts the best IP preventing spoofing
export function resolveIp(request: Request | NextRequest | any): string {
  // Edge/Vercel priority
  if (request.ip) return request.ip;
  
  const headers = request.headers;
  const ip =
    (headers.get ? headers.get('cf-connecting-ip') : headers['cf-connecting-ip']) ??
    (headers.get ? headers.get('true-client-ip') : headers['true-client-ip']) ??
    (headers.get ? headers.get('x-forwarded-for')?.split(',')[0].trim() : headers['x-forwarded-for']?.split(',')[0].trim()) ??
    '127.0.0.1';

  return ip;
}

// 2. Initialize Redis client (with graceful error handling if ENV is missing)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = !!(redisUrl && redisToken);

const redis = isRedisConfigured
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Graceful fallback: local Map if Redis is not configured
const fallbackCache = new Map();
const localWindows = new Map<string, number[]>();
const LOCAL_WINDOW_MS = 60_000;
const LOCAL_MAX_IDENTIFIERS = 10_000;

function enforceLocalLimit(identifier: string, limit: number, path: string) {
  const now = Date.now();
  const key = `${limit}:${identifier}`;
  const windowStart = now - LOCAL_WINDOW_MS;
  const timestamps = (localWindows.get(key) || []).filter((timestamp) => timestamp > windowStart);

  if (timestamps.length >= limit) {
    const reset = timestamps[0] + LOCAL_WINDOW_MS;
    const error = new AppError('Too many requests, please try again later.', 429);
    (error as AppError & { headers?: Record<string, string> }).headers = {
      'Retry-After': Math.max(1, Math.ceil((reset - now) / 1000)).toString(),
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': reset.toString(),
    };
    logger.warn({ ip: identifier, path, limitTier: limit }, '[RATE_LIMIT_EXCEEDED] Request blocked locally');
    throw error;
  }

  timestamps.push(now);
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

// Map to hold instantiated ratelimiters
const limiters = new Map<number, Ratelimit>();

function getLimiter(limit: number): Ratelimit {
  if (!limiters.has(limit)) {
    limiters.set(
      limit,
      new Ratelimit({
        redis: redis || (fallbackCache as any),
        limiter: Ratelimit.slidingWindow(limit, '60 s'),
        ephemeralCache: fallbackCache, // Use local cache to speed up and reduce Redis ops
      })
    );
  }
  return limiters.get(limit)!;
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
    const limiter = getLimiter(limit);
    const { success, pending, limit: rateLimitLimit, remaining, reset } = await limiter.limit(identifier);

    // wait for async operations (like telemetry/analytics) to complete
    if (pending) await pending;

    if (!success) {
      logger.warn({ ip: identifier, path, limitTier: limit }, '[RATE_LIMIT_EXCEEDED] Request blocked');
      
      const error = new AppError('Too many requests, please try again later.', 429);
      // Attach headers info to the error so the API handler can return them
      (error as any).headers = {
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': rateLimitLimit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      };
      throw error;
    }
  } catch (error: any) {
    // If it's our own AppError, rethrow it
    if (error instanceof AppError) throw error;
    
    // If Redis fails or Ratelimit crashes, we log the error and ALLOW the request (fail-open)
    // to prevent infrastructure issues from causing a complete outage.
    logger.error({ err: error, identifier }, '[RATE_LIMIT_ERROR] Failed to execute rate limiting. Failing open.');
  }
}
