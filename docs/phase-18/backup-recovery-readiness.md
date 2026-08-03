# Backup and Recovery Readiness

## The Final Safety Net

Before launch, we must prove that we can survive a worst-case scenario. Assuming backups work without testing them is unacceptable.

### Readiness Requirements

1. **Verified Backups:**
   - **Check:** Verify that the automated database backup job ran successfully within the last 24 hours and deposited a file in the expected secondary storage location.

2. **Restore Drills Completed:**
   - **Blocker:** The team must have executed a successful "Game Day" restore drill (Phase 15) to a staging environment within the last 30 days. If the drill failed, the launch is blocked until the recovery process is fixed.

3. **Rollback Plan Available:**
   - **Check:** Ensure the deployment platform (e.g., Vercel) has instant rollbacks enabled and the team knows the exact CLI command or UI button to trigger it.

4. **Recovery Contacts Known:**
   - **Check:** Document the emergency contact numbers for the Database Hosting Provider, the DNS Registrar, and the primary on-call engineers. Ensure these are pinned in the `#ops` Slack channel.

5. **Post-Failure Communication Plan:**
   - **Check:** Draft a generic "We are experiencing technical difficulties" message. Ensure the team knows how to update the DNS to point to a static maintenance page if the primary application infrastructure fails completely.
