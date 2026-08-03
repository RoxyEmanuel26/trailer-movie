# Monitoring and Alerting for Continuity

## Knowing the Safety Net is Active

A backup that silently fails for 6 months is worse than no backup at all, because it creates a false sense of security.

### Backup Job Monitoring
- **Alert:** If the automated daily database snapshot fails to complete, trigger an immediate PagerDuty/Slack alert to the DevOps team.
- **Alert:** If the continuous WAL archiving (for PITR) falls more than 5 minutes behind, trigger a warning.

### Storage Capacity Warnings
- **Alert:** If the backup storage bucket reaches 90% of its allocated budget or physical limits (if applicable), trigger an alert to prevent backup jobs from failing due to lack of space.

### Backup Age Warnings
- **The "Deadman's Switch":** Set up an independent monitoring script that checks the timestamp of the latest backup in the storage bucket.
- **Alert:** If the newest backup is older than 26 hours (assuming daily backups), trigger a critical alert. This catches scenarios where the backup software reports "success" but actually failed to write the file to the bucket.

### Unusual Deletion Detection
- **Alert:** If the Cloud provider detects an attempt to delete an unusually high number of objects from the media bucket, or an attempt to drop the primary database table, trigger a high-severity security alert and potentially automatically freeze the account.
