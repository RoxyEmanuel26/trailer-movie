# Table Design: Analytics & Telemetry

These tables record usage patterns to guide future product decisions without relying heavily on third-party trackers (like Google Analytics) for core insights.

## 1. `search_logs` Table
Vital for understanding what users want and if they are finding it.
- **id** (UUID/BIGINT) - Primary Key
- **query** (VARCHAR) - Required. The exact string typed by the user.
- **results_count** (INTEGER) - Required. How many movies matched. (0 indicates a missed opportunity).
- **session_id** (VARCHAR) - Optional. Anonymized hash to track successive searches.
- **created_at** (TIMESTAMP) - Required.

## 2. `analytics_events` Table
Tracks specific interactions (e.g., playing a trailer, clicking an affiliate link).
- **id** (UUID/BIGINT) - Primary Key
- **event_name** (VARCHAR) - Required. (e.g., `trailer_play`, `affiliate_click`).
- **entity_type** (VARCHAR) - Optional. Polymorphic (e.g., `Movie`, `Trailer`).
- **entity_id** (UUID/BIGINT) - Optional.
- **metadata** (JSON) - Optional. Extra context (e.g., `{"affiliate_target": "fandango"}`).
- **created_at** (TIMESTAMP) - Required.

## Data Philosophy & Retention
These tables will grow massively.
- **No PII:** Do not log IP addresses or raw User Agents in public analytics tables to comply with GDPR/CCPA.
- **Archival:** Set up a cron job to aggregate `search_logs` and `analytics_events` older than 90 days into summary tables and delete the raw rows to preserve database performance.
