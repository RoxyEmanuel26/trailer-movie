# Data Quality and Validation

## Ensuring Trust in Metrics

If the team cannot trust the analytics data, the dashboards are useless. The architecture must ensure data integrity.

### Event Validation Rules
- The analytics ingestion endpoint must validate incoming events against a strict schema (e.g., ensuring `event_name` is present and matches an allowed list, `timestamp` is valid).
- Invalid events should be rejected or shunted to a "dead letter queue" for debugging, preventing them from corrupting the main analytics database.

### Deduplication Expectations
- Network retries or frontend bugs can cause the same event to be sent twice.
- Include a unique `event_id` (e.g., a UUID generated on the client) with every payload. The ingestion layer must use this ID to deduplicate events within a short time window.

### Missing Data Handling
- Expect ad-blockers and privacy browsers (like Brave) to block a significant percentage of client-side tracking scripts.
- Treat client-side behavioral analytics as directional sampling, not absolute truth.
- For absolute truth (e.g., total API requests, total server errors), rely on server-side logs and metrics.

### Bot Filtering Ideas
- A large percentage of public web traffic is automated bots.
- Filter out obvious bots at the CDN/WAF level before they hit the application.
- Exclude known bot User-Agents from the behavioral analytics processing pipeline.
- Identify anomalous traffic patterns (e.g., 10,000 page views from one session ID in an hour) and retroactively exclude them from aggregate reports.

### Schema Versioning
- As the product evolves, the event schema will change (e.g., adding a new property to the `trailer_play` event).
- Include a `schema_version` property in events to allow downstream data pipelines to handle different versions of the data gracefully without breaking dashboards.
