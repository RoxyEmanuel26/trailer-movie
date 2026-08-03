# Security and Access Control for Recovery

## Guarding the Backdoor

Backup systems inherently contain a complete copy of all sensitive company data. They are a prime target for attackers.

### Access to Backup Storage
- **Separation of Accounts:** The AWS/Cloud account that holds the backups should be entirely separate from the AWS/Cloud account that runs the production application.
- **Least Privilege:** The production application only has `WRITE` access to push backups (or the DBaaS handles it internally). It has **zero** `READ` or `DELETE` access to the backup storage bucket. If the production app is compromised, the attacker cannot read historical data or delete the backups.

### Execution of Recovery Operations
- **Who can restore?** Only Lead/Senior DevOps engineers with Multi-Factor Authentication (MFA) enabled.
- **The "Two-Key" Rule:** For highly destructive operations (e.g., permanently failing over to a secondary region and abandoning the primary database), the system should require approval from two separate administrators (e.g., via a ChatOps Slack integration or a dedicated deployment tool).

### Secret Exposure Prevention
- During a disaster, engineers often move fast and cut corners.
- **Rule:** Never paste the new `DATABASE_URL` or restored API keys into Slack or an unencrypted document. Always use a secure password manager or the platform's official Secret Manager UI, even during a high-pressure outage.

### Audit Logging
- Every action taken in the backup console (e.g., initiating a snapshot, downloading a dump file) must be immutably logged in a secure audit trail (e.g., AWS CloudTrail) that cannot be altered by the administrators themselves.
