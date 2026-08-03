export class TmdbError extends Error {
  public status: number;
  public statusMessage: string;

  constructor(status: number, statusMessage: string) {
    super(`TMDB API Error (${status}): ${statusMessage}`);
    this.name = 'TmdbError';
    this.status = status;
    this.statusMessage = statusMessage;
  }
}

export class TmdbRateLimitError extends TmdbError {
  public retryAfter: number; // in seconds

  constructor(retryAfter: number) {
    super(429, 'Too Many Requests');
    this.name = 'TmdbRateLimitError';
    this.retryAfter = retryAfter;
  }
}
