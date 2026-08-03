# Operational Runbooks

## Step-by-Step Operations

A runbook is a documented procedure for completing a specific operational task. It must be written so clearly that an engineer awakened at 3:00 AM can execute it without making a mistake.

### Essential Runbooks Required

1. **Deployment Runbook:**
   - Explains the CI/CD pipeline, how to read the output logs, and how to manually trigger a deploy if the automated GitHub Action fails.

2. **Rollback Runbook:**
   - Exact steps (with screenshots of the UI or CLI commands) to instantly revert a bad deployment.

3. **Disaster Recovery (DR) Runbook:**
   - (Defined in Phase 15). The exact steps to spin up a new database from a snapshot and update the application to use it.

4. **Admin Account Recovery:**
   - What to do if the Super Admin gets locked out (e.g., resetting a password directly in the database, or bypassing SSO temporarily via a secure CLI script).

5. **Security Incident Runbook:**
   - Steps to take if a breach is detected (e.g., rotating all API keys, forcing logout for all active sessions, and isolating the database).

6. **Content Corruption Runbook:**
   - How to use the CMS tools to revert a massive editorial mistake (e.g., restoring deleted records from soft-delete status via a script).

### Runbook Maintenance
Runbooks must be tested. A runbook that contains a deprecated CLI command is useless. Testing runbooks is part of the Routine Maintenance schedule (Phase 16).
