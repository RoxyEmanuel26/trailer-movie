# Rollback and Incident Recovery

## Stopping the Bleeding

When a bad deployment slips through the gates and breaks production, speed of recovery is more important than debugging. Debugging happens later; restoring service happens now.

### Application Rollback Concept
- Because the CI/CD pipeline builds immutable artifacts, rolling back does not involve running `git revert` and waiting 10 minutes for a new build.
- **Action:** An authorized engineer clicks "Rollback" in the hosting provider's dashboard. The routing layer instantly repoints traffic to the previous known-good deployment artifact. Recovery time: < 30 seconds.

### Database Rollback Caution
- Do not attempt to automatically roll back database schema changes.
- If a schema change (Migration V2) broke the app, but the app was rolled back to V1, V1 should still function perfectly *if* the schema rules in the Database Strategy (Phase 14, Section 7) were followed (backward compatibility).

### Incident Triage Flow
1. **Acknowledge:** On-call engineer receives PagerDuty alert.
2. **Mitigate (Stop the Bleeding):** 
   - Was a deploy just merged? -> Instant Rollback.
   - Is it a malicious attack? -> Block IP at CDN WAF.
   - Is a third-party API down? -> Toggle feature flag to disable the integration.
3. **Resolve:** After the site is stable, debug the root cause locally, write a regression test, fix the code, and push a new PR.
4. **Post-Mortem:** Document why it happened and how to prevent it in the future without placing blame.

### Emergency Disable Switches
- Implement feature flags (e.g., using LaunchDarkly or simple environment variables). If a heavy new feature (like a real-time chat) brings down the database, it can be disabled instantly via a configuration toggle without requiring a code deployment.
