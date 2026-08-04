import { AppError } from '../errors';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitTracker>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, tracker] of rateLimitStore.entries()) {
    if (tracker.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 300000).unref?.();

// Default limit of 100 requests per minute
export const rateLimit = (
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
) => {
  const now = Date.now();
  const tracker = rateLimitStore.get(identifier);

  if (!tracker || tracker.resetAt < now) {
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
