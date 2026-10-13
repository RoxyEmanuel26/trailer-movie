const TRANSIENT_DATABASE_CODES = new Set([
  'P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'P2034',
  '08000', '08001', '08003', '08006', '53300', '57P03',
  'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
]);

export function isTransientDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (typeof candidate.code === 'string' && TRANSIENT_DATABASE_CODES.has(candidate.code)) return true;
  if (typeof candidate.message === 'string' &&
    /timeout exceeded when trying to connect|operation has timed out|connection terminated (?:unexpectedly|due to connection timeout)|too many clients already|remaining connection slots|timed out fetching a new connection|socket timeout/i.test(candidate.message)) {
    return true;
  }
  return candidate.cause && candidate.cause !== error
    ? isTransientDatabaseError(candidate.cause)
    : false;
}
