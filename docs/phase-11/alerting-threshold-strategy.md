# Alerting and Threshold Strategy

## Operator Notifications

Alerts must be actionable. Alert fatigue—where operators ignore constant warnings—is a major operational risk.

### Defining Severity Levels
- **P1 (Critical):** Site is completely down, core feature (trailer playback) is globally broken, or active security breach. Pagers go off 24/7.
- **P2 (High):** Significant degradation. Search is very slow, a specific region is failing, or background syncs have failed for 24 hours. Addressed during business hours or immediately if impacting revenue/reputation.
- **P3 (Warning):** Anomaly detected but system functioning. Slight uptick in 500 errors, cache hit rate dropping. Logged for review during normal workflows.

### Alert Categories
- **Error Spikes:** Alert if 5xx errors exceed 1% of total traffic for 5 consecutive minutes.
- **API Failures:** Alert if P99 latency on the main movie fetch endpoint exceeds 2 seconds.
- **Sync Failures:** Alert if the TMDB sync job fails 3 consecutive times.
- **Traffic Anomalies:** Alert if traffic drops by 50% compared to the same hour last week (possible CDN or DNS issue).
- **Security Anomalies:** Alert on 10+ failed admin logins from a single IP within 5 minutes.

### Noise Control
- **Thresholds:** Never alert on a single failed request. Require sustained thresholds or percentage-based anomalies over a time window.
- **Routing:** Route P1 alerts to SMS/PagerDuty. Route P3 warnings to a low-priority Slack channel or a daily email digest.
- **Muting:** Ensure operators have an easy way to temporarily mute an alert while an incident is actively being investigated.
