# Error Handling & Resilience

The API layer must degrade gracefully. A failure in an external service or a minor database hiccup should not take down the entire public frontend.

## 1. Provider Timeout Handling
- External API calls (TMDB, YouTube) must be wrapped with strict timeouts (e.g., `5000ms`). If the provider hangs, the API thread must not be blocked indefinitely.
- If a timeout occurs during a background sync, the job is marked as failed and queued for a retry.

## 2. Missing Data Handling
- If a movie lacks a trailer or a poster, the API response must not throw a 500 error. 
- **Contract:** Missing optional fields must return `null` or an empty array `[]`. The frontend UI is responsible for rendering empty states (e.g., a fallback poster icon).

## 3. Circuit Breaker Pattern (Concept)
If TMDB is experiencing a major outage and returning 503s, our sync cron job shouldn't slam their servers with 500 retries. 
- Implement a basic circuit breaker: If 5 consecutive external requests fail, pause all sync jobs for 15 minutes and alert the admin.

## 4. Invalid Response Handling
- Never trust external data. If TMDB promises an array of genres but returns a string, it will crash the backend.
- **Strategy:** Validate all external JSON payloads using a schema validation library (like Zod or Joi) before attempting to insert data into the local database. If validation fails, log the anomaly and discard the payload.

## 5. Graceful Degradation for Frontend
- If the `/api/v1/movies/trending` endpoint fails (e.g., database connection timeout), the CDN should serve the last known good cached response (Stale-While-Revalidate pattern) rather than serving a 500 error page to the user.
