# System Monitoring Goals

## Operational Signals

While analytics track user behavior, system monitoring tracks the health of the infrastructure supporting that behavior.

### API Latency
- Monitor the P50, P90, and P99 latency of all backend endpoints.
- High P99 latency indicates that while most requests are fast, some users are experiencing severe degradation, often pointing to database query inefficiencies.

### Error Rates
- Track HTTP 5xx errors (server crashes) and 4xx errors (client errors).
- A sudden spike in 5xx errors requires immediate alerting. A spike in 404s might indicate broken links or a missing API route after a deployment.

### Sync Success/Failure
- If the platform pulls data from external sources (e.g., TMDB), monitor the success rate and duration of these background sync jobs. A silent failure here means the site's content becomes stale.

### Cache Hit/Miss Concepts
- Monitor the CDN edge cache and any internal data caches (e.g., Redis).
- A low cache hit rate on public endpoints indicates poor cache configuration and unnecessary load on the origin server.

### Build or Deploy Health Concepts
- Track the duration and success rate of CI/CD pipelines. Failing builds block the delivery of fixes.

### Database Health Concepts
- Monitor active connections, CPU utilization, memory, and slow query logs on the primary database.

### Alert-Worthy Anomalies
- High CPU utilization without a corresponding spike in traffic.
- Sudden drops in overall traffic (which might indicate a DNS or CDN failure).
- Memory leaks leading to out-of-memory (OOM) kills of the application process.
