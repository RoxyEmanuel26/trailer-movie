# Retention Strategy

## Balancing Flexibility and Cost

We cannot keep every backup forever. A strict retention policy controls storage costs while providing adequate historical coverage.

### Database Retention Policy
- **Short-Term (Point-in-Time):** Retain WAL logs for **7 days**. This allows precise recovery from recent human errors (e.g., "undo what the editor did 3 hours ago").
- **Medium-Term (Daily Snapshots):** Retain the daily snapshots for **30 days**. This protects against slow-moving corruption (e.g., a bug that subtly corrupts data, discovered two weeks later).
- **Long-Term Archival (Monthly Snapshots):** On the 1st of every month, take a snapshot and move it to cold storage (e.g., AWS Glacier). Retain for **1 year** for compliance and historical auditing.

### Media Asset Retention Policy (Soft Deletes)
- **Versioning:** Enable Object Versioning on the storage bucket. If an admin deletes or overwrites a poster, the old version is kept as a non-current version.
- **Pruning:** Automatically delete non-current versions after **30 days**. This prevents the bucket from growing infinitely due to old, replaced assets.

### Audit Log Retention
- Retain security and admin audit logs in hot storage for **90 days**.
- Archive to cold storage for **1 year**.

### The Cost Trade-off
Storing 365 daily snapshots of a 100GB database is prohibitively expensive and unnecessary. The tiered approach ensures we pay premium prices only for the most likely recovery scenarios (the last 7 days).
