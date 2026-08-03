# Background Jobs and Async Processing

## Handling Heavy Lifting Safely

Operations that take longer than a few seconds or must happen on a schedule must not block the main HTTP request/response cycle.

### When to Use Async Jobs
- **Sync Jobs:** Pulling metadata from external APIs (TMDB) for 500 movies.
- **Analytics Aggregation:** Compiling raw page views into daily summary tables (Phase 11).
- **Media Processing:** Generating optimized WebP versions of an uploaded 10MB poster.
- **Cache Warming:** Rebuilding complex static pages in the background after a major content update.

### Infrastructure Strategy
- **Decoupled Workers:** Background jobs must run on separate infrastructure from the main web/API servers. A CPU spike during video processing must not cause the public homepage to slow down.
- **Message Queues:** The web API pushes an event (e.g., `PROCESS_IMAGE`) to a queue (e.g., AWS SQS, Redis BullMQ, Upstash Kafka). A worker service pulls from the queue at its own pace.

### Retry and Failure Isolation
- Jobs will fail (e.g., the external API is temporarily down).
- **Idempotency:** Jobs must be written so they can be safely retried multiple times without corrupting data.
- **Exponential Backoff:** If a job fails, the queue should retry it automatically, increasing the wait time between attempts (e.g., 1m, 5m, 15m) to avoid hammering a recovering external service.
- **Dead Letter Queue (DLQ):** If a job fails repeatedly (e.g., 5 times), it is moved to a DLQ where it sits indefinitely until a developer manually inspects and resolves the error.
