/**
 * Calculates the exponential backoff delay.
 * @param retryCount Current attempt number (0-indexed)
 * @param baseDelayMs Base delay in milliseconds (default 1000ms)
 * @param maxDelayMs Maximum allowed delay (default 1 hour)
 */
export function calculateExponentialBackoff(
  retryCount: number,
  baseDelayMs = 1000,
  maxDelayMs = 3600000
): number {
  const delay = Math.pow(2, retryCount) * baseDelayMs;
  return Math.min(delay, maxDelayMs);
}

/**
 * Error classes specific to Background Jobs
 */
export class NonRetryableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableJobError';
  }
}

export class RetryableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableJobError';
  }
}
