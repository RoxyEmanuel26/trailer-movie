# Monitoring for Growth

## Scaling Analytics

As traffic grows from hundreds to millions of users, the analytics architecture must scale without bankrupting the project.

### High-Traffic Event Aggregation
- At massive scale, writing every single `page_view` event to a database in real-time is unsustainable.
- Implement server-side aggregation (e.g., using Redis or a memory cache to increment a counter, flushing the total to the database every 60 seconds) for extremely high-volume metrics.

### Partitioning or Batching
- Analytics databases (e.g., ClickHouse, Snowflake, BigQuery) should be partitioned by date (e.g., daily partitions). This ensures that querying the last 7 days of data remains fast even if there are 5 years of historical data in the table.
- Ingestion endpoints should batch incoming events (e.g., accepting an array of events rather than a single event per HTTP request) to reduce network overhead and connection limits.

### Sampling Ideas
- If traffic becomes overwhelming, implement sampling for high-volume, low-criticality events (like `scroll_depth`).
- For example, only track `scroll_depth` for a random 10% of sessions. The resulting data is still statistically significant for understanding UX, but processing costs are reduced by 90%.
- Never sample critical events like `trailer_play` or `api_error`.

### Dashboard Performance Under Growth
- Dashboards querying raw event tables will slow down as data grows.
- Utilize materialized views or pre-aggregated summary tables (e.g., `daily_movie_stats`) to power fast dashboards, avoiding scanning billions of raw events for routine daily checks.
