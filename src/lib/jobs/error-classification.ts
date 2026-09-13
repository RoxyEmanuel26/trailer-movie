import { TmdbError, TmdbRateLimitError } from '../tmdb/errors';
import { NonRetryableJobError, RetryableJobError } from './retry';

export type ClassifiedJobError = {
  code: string;
  message: string;
  retryable: boolean;
  retryAfterSeconds?: number;
};

export function classifyJobError(error: unknown): ClassifiedJobError {
  const candidate = error as { code?: string; status?: number; message?: string; retryAfter?: number };
  const message = candidate?.message || String(error);

  if (error instanceof NonRetryableJobError) {
    return { code: 'NON_RETRYABLE', message, retryable: false };
  }
  if (error instanceof RetryableJobError) {
    return { code: error.name === 'PartialJobError' ? 'PARTIAL_IMPORT' : 'RETRYABLE', message, retryable: true };
  }
  if (error instanceof TmdbRateLimitError || candidate?.status === 429) {
    return { code: 'TMDB_RATE_LIMIT', message, retryable: true, retryAfterSeconds: candidate.retryAfter };
  }
  if (error instanceof TmdbError) {
    if ([400, 401, 403, 404, 422].includes(error.status)) {
      return { code: `TMDB_${error.status}`, message, retryable: false };
    }
    return { code: `TMDB_${error.status}`, message, retryable: error.status >= 500 };
  }
  if (candidate?.code && ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2034'].includes(candidate.code)) {
    return { code: candidate.code, message, retryable: true };
  }
  if (candidate?.code?.startsWith('P')) {
    return { code: candidate.code, message, retryable: false };
  }
  if (/timeout|connection|socket|fetch failed/i.test(message)) {
    return { code: candidate.code || 'TRANSIENT_IO', message, retryable: true };
  }
  return { code: candidate?.code || 'UNKNOWN', message, retryable: false };
}

export function calculateRetryAt(attempt: number, retryAfterSeconds?: number) {
  const minutes = [1, 5, 20, 60][Math.min(Math.max(attempt - 1, 0), 3)];
  const baseMs = retryAfterSeconds ? retryAfterSeconds * 1000 : minutes * 60_000;
  const jitterMs = Math.floor(Math.random() * Math.min(30_000, baseMs * 0.1));
  return new Date(Date.now() + baseMs + jitterMs);
}
