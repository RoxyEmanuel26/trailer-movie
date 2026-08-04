import { AppError } from '../errors';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitTracker>();
const MAX_STORE_SIZE = 5000; // Cap to prevent memory leaks in long-running processes

// Default limit of 100 requests per minute
export const rateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
) => {
  const now = Date.now();
  let tracker = rateLimitStore.get(identifier);

  // Lazy cleanup if expired
  if (tracker && tracker.resetAt < now) {
    rateLimitStore.delete(identifier);
    tracker = undefined;
  }

  if (!tracker) {
    // Prevent unbounded growth by clearing old/random entries if we hit the limit
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      // In a real LRU this is better, but here we just clear it to avoid OOM
      // For production, consider using Redis (e.g. Upstash) or lru-cache
      rateLimitStore.clear(); 
    }
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  tracker.count++;
  if (tracker.count > limit) {
    throw new AppError('Too many requests, please try again later.', 429);
  }
};
