# Backup Frequency Strategy

## Aligning with the Change Rate

Backup frequency must reflect how often data changes and how much data the business can afford to lose (RPO).

### Database (High Change Rate)
- **Continuous (WAL):** The primary database must have Point-in-Time Recovery (PITR) enabled. This relies on continuous Write-Ahead Log (WAL) archiving, allowing restoration to any specific minute in the last 7 days.
- **Daily Snapshots:** A full, complete snapshot of the database is taken once every 24 hours during the lowest traffic period (e.g., 3:00 AM UTC).

### Media Assets (Medium Change Rate)
- **Continuous Replication:** Object Storage (S3) does not use "snapshots" in the traditional sense. Instead, Cross-Region Replication (CRR) should be enabled, meaning every time a new poster is uploaded, it is immediately copied to a backup bucket in a different region.

### Infrastructure Configuration (Low Change Rate)
- **Event-Driven:** Configuration in Git is backed up every time a developer pushes code. Changes to the Secret Manager should trigger an automatic audit log entry and, ideally, a configuration snapshot export.

### Manual / Pre-Deployment Snapshots
- **High-Risk Operations:** Before executing a major, destructive database migration (e.g., dropping obsolete tables) or importing a massive batch of movies, an admin must manually trigger a "Pre-Deployment Snapshot" of the database. This guarantees a safe fallback point that is exactly 1 minute old.
