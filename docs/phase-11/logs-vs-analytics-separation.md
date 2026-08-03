# Logs vs Analytics Separation

## Defining the Boundary

It is crucial to separate operational logs, behavioral analytics, and security audit trails to manage cost, privacy, and utility.

### What Belongs in Analytics Events
- **Behavioral Data:** Clicks, page views, search terms, engagement metrics.
- **Audience Data:** Anonymous session IDs, general geolocations, device types.
- **Destination:** A specialized analytics database or service (e.g., Mixpanel, PostHog, Google Analytics).

### What Belongs in Operational Logs
- **System States:** Server startup, job execution times, cache invalidation notices.
- **Errors and Exceptions:** Stack traces, API failure details.
- **Destination:** A log aggregation tool (e.g., Datadog, AWS CloudWatch, Logflare).
- **Rule:** Logs must be scrubbed of PII. They are for debugging systems, not analyzing users.

### What Belongs in Audit Logs
- **Sensitive Mutations:** Admin logins, role changes, massive content deletions, configuration changes.
- **Destination:** A highly secure, append-only datastore separate from the main application database.
- **Rule:** Audit logs must definitively answer "who did what, and when," prioritizing security and compliance over aggregate trends.

### Avoiding Unnecessary Duplication
- Do not log a JSON representation of every analytics event into the operational log stream. This doubles storage costs and makes operational logs noisy and harder to search for actual errors.
- Keep the streams independent at the ingestion layer.
