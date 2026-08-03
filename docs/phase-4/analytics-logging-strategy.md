# Analytics & Logging Strategy

The API must track usage and errors to ensure the platform remains healthy and to guide product decisions.

## 1. Product Analytics Tracking
- **Endpoint:** `POST /api/v1/analytics/track`
- **Events Tracked:** 
  - `trailer_play` (Fired when a user clicks play on a trailer facade).
  - `affiliate_click` (Fired when a user clicks a "Buy Tickets" link).
- **Privacy:** Do not log IP addresses or raw User Agents in the database. Use anonymized session IDs if sequential tracking is necessary.

## 2. API Observability (Logs)
- **External API Latency:** Wrap calls to TMDB and YouTube in a timer. Log to stdout if a provider takes longer than `2000ms` to respond. This allows proactive detection of provider degradation.
- **Sync Failures:** If a cron job fails to sync a movie, log the exact external API error response and the movie ID.
- **Rate Limit Incidents:** Log when a user hits a rate limit (429). If a single IP repeatedly hits the limit, it flags potential scraping activity.

## 3. The CMS Audit Trail
- Every mutating request (`POST`, `PUT`, `DELETE`) hitting `/api/admin/*` must trigger the `AuditService`.
- The service writes a row to the `audit_logs` table containing the admin's User ID, the action taken, and a JSON diff of the changes. This guarantees accountability if invalid data is published to the public site.
