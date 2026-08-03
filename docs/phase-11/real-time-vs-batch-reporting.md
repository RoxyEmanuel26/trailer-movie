# Real-Time vs Batch Reporting

## Metric Freshness

Not all data needs to be available the second it is generated. Balancing freshness with processing cost is critical.

### Real-Time or Near-Real-Time Signals (< 5 minutes)
- **System Health:** API errors, latency spikes, and server crashes must be real-time. If the site is down, operators must know immediately.
- **Security Alerts:** Admin login failures or anomalous bulk deletions.
- **Trending Metrics:** Immediate surges in traffic to a specific movie (useful for auto-updating a "Trending Now" UI component).

### Hourly or Daily Summaries (Batch)
- **Traffic Aggregates:** Total daily page views, unique visitors, or bounce rates.
- **Content Performance:** Calculating the daily "Most Engaging" movies.
- **Search Term Aggregations:** Daily lists of top searches and zero-result searches.

### Weekly and Monthly Trends
- **Retention Cohorts:** Measuring if visitors from Week 1 return in Week 4.
- **SEO Growth:** Month-over-month organic traffic comparisons.

### Trade-offs
- Real-time analytics require complex stream processing architectures (e.g., Kafka, Kinesis) and are expensive to run.
- Batch processing (e.g., daily cron jobs aggregating data in a data warehouse) is vastly cheaper and sufficient for 90% of business reporting needs. The architecture should lean heavily on batch processing for business metrics, reserving real-time processing strictly for operational and security alerting.
