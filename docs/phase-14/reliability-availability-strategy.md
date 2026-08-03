# Reliability and Availability Strategy

## Staying Online

High availability means minimizing downtime, even when underlying components fail.

### Graceful Degradation
- The application must not crash completely if a non-critical dependency fails.
- **Example:** If the recommendation engine API goes down, the movie detail page should still load perfectly, simply hiding the "Similar Movies" section or replacing it with a hardcoded static list of popular movies.

### Retry and Backoff Concepts
- Network requests are inherently flaky.
- Any internal HTTP call (e.g., the API calling an external search provider) must implement an exponential backoff retry mechanism (e.g., try, wait 100ms, try, wait 500ms, try, wait 2s, fail).

### Failover Ideas
- **Database:** Utilize a managed Database-as-a-Service (DBaaS) that automatically handles Multi-AZ (Availability Zone) failover. If the primary instance's hardware fails, the provider automatically promotes a standby replica to primary within seconds.
- **CDN:** Relying on top-tier global CDNs inherently provides failover. If a PoP in London goes offline, traffic is seamlessly routed to the next closest PoP (e.g., Paris).

### Maintenance Windows
- The architecture is designed for zero-downtime deployments. However, for massive, backward-breaking database schema overhauls, a scheduled maintenance window may be required.
- During this window, the CDN should be configured to serve a beautifully branded, static "We'll be right back" page with HTTP status 503 (Service Unavailable) to preserve SEO rankings.
