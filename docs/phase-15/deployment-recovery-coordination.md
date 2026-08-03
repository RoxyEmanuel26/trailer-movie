# Deployment Recovery Coordination

## Rollbacks vs. Restores

It is crucial to understand the difference between fixing a bad code deployment and fixing corrupted data.

### The "Bad Release" Scenario (Code Issue)
- **Symptoms:** Immediately after deploying v1.2, the homepage throws 500 errors.
- **Action:** **Application Rollback.** Use the hosting provider to instantly revert routing to the v1.1 artifact.
- **Database Status:** Do *not* touch the database. If Phase 14 migration rules were followed, the database schema is backward-compatible with v1.1.

### The "Bad Migration" Scenario (Data Issue)
- **Symptoms:** A deployment included a script that accidentally dropped a critical column or malformed existing data.
- **Action:** **Coordinated Recovery.** 
  1. Halt all new incoming traffic (Maintenance Mode).
  2. Roll back the application code to v1.1.
  3. Restore the database from the Pre-Deployment Snapshot (taken exactly 1 minute before the deployment).
  4. Bring traffic back online.

### Environment Parity During Restore
- Never attempt to test a database restore directly in Production.
- Always restore the snapshot to a new Staging database instance first. Point the Staging application environment at it to verify the data is intact and functional before promoting that database instance to Production.
