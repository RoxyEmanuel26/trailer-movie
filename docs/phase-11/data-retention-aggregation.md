# Data Retention and Aggregation

## Storage Management

Analytics data grows exponentially. Without a retention strategy, storage costs will outpace the value of the data.

### Raw Event Retention Expectations
- Raw behavioral events (e.g., every single click and page view) are bulky.
- Retain raw behavioral data for a limited window (e.g., 30 to 90 days) to allow for deep-dive investigations and debugging.

### Aggregated Metric Retention Expectations
- Aggregated data (e.g., "On Jan 1st, Movie ID 123 had 400 trailer plays") is extremely compact.
- Retain aggregated daily/weekly/monthly metrics indefinitely to allow for long-term year-over-year trend analysis.

### Log Retention Expectations
- Retain raw operational logs for a short window (e.g., 14 to 30 days) for immediate debugging.
- Archive logs to cheap cold storage (e.g., AWS S3 Glacier) for compliance purposes (e.g., 1 year), but do not keep them in the fast, searchable log interface.

### Archival and Pruning Strategy
- Implement automated lifecycle policies.
- At day 30, aggregate the raw events into daily summaries in the main database.
- Move the raw events to cold storage.
- At day 365, delete the raw events from cold storage entirely.

### Cost Control Considerations
- Before adding a new event to the tracking plan, evaluate its cost. Tracking `scroll_depth` every 10 pixels generates massive volume. Track it only at key milestones (25%, 50%, 100%) or omit it if the data won't actually change a product decision.
