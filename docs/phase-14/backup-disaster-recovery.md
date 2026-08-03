# Backup and Disaster Recovery

## Planning for the Worst

Disaster Recovery (DR) is the process of restoring the application after a catastrophic failure (e.g., a data center fire, or a malicious admin dropping the database).

### Recovery Objectives
- **RPO (Recovery Point Objective):** How much data can we afford to lose? For this project: 24 hours maximum (daily backups), though Point-in-Time Recovery (PITR) is preferred.
- **RTO (Recovery Time Objective):** How quickly must we be back online? For this project: Under 4 hours from disaster declaration.

### Database Backup Strategy
- Enable automated daily snapshots on the managed database.
- Enable Point-in-Time Recovery (PITR). This writes a continuous Write-Ahead Log (WAL), allowing an admin to restore the database to its exact state at, for example, 2:14 PM yesterday, right before a destructive query was run.

### Media Backup Strategy
- Enable Cross-Region Replication on the primary Object Storage bucket (e.g., replicate `us-east-1` bucket to `us-west-2`). If the primary region goes entirely offline, media can be restored from the backup bucket.

### Configuration Backup
- The infrastructure configuration should ideally be defined as Code (IaC) in Git.
- If the hosting provider account is compromised, the infrastructure can be spun up on a new account simply by applying the IaC templates and injecting the secret keys.

### Restore Testing Expectations
- A backup is only valid if it can be restored.
- **Mandatory Drill:** Once every 6 months, a developer must attempt to spin up a Staging environment using only the automated database backups to verify the backup files are not corrupted.
