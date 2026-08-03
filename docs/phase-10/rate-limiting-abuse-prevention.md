# Rate Limiting and Abuse Prevention

## Throttling and Anti-Abuse

Rate limiting protects the application's availability and prevents automated malicious actions.

### Login Abuse Limits
- Strict limits on the `/login` endpoint.
- e.g., Maximum 5 failed attempts per IP per 15 minutes.
- e.g., Maximum 5 failed attempts per username globally per 15 minutes (to prevent distributed attacks on a single account).

### Search Abuse Limits
- Implement moderate rate limiting on public search endpoints to prevent database exhaustion via automated heavy queries.
- e.g., 30 search requests per minute per IP.

### Scraping Control Ideas
- While public movie data is meant to be seen, aggressive scraping drains resources.
- Rely on CDN-level bot management (e.g., Cloudflare Bot Fight Mode) to block known malicious scrapers and datacenters.
- Implement volumetric rate limiting across the entire public API (e.g., 500 requests per 5 minutes per IP).

### Bulk Operation Limits
- In the admin panel, rate limit bulk operations (like updating 100 movies at once). If an attacker gains access, this slows down their ability to destroy the database rapidly.

### Sync Trigger Restrictions
- If there are endpoints to trigger external syncs (e.g., "Sync latest from TMDB"), these must be heavily rate-limited (e.g., once per 10 minutes) to prevent an attacker from repeatedly triggering heavy background jobs that crash the server.

### IP or Reputation-Based Controls
- Utilize web application firewalls (WAF) to block traffic from IP addresses with known bad reputations (e.g., Tor exit nodes, anonymous proxies) if they are frequently used for abuse on the platform.
- Temporarily ban IPs that repeatedly trigger 401 Unauthorized or 403 Forbidden errors.
