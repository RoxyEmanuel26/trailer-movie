# Emergency Launch Reversal

## Pulling the Ripcord

If a launch goes catastrophically wrong, the team must execute a reversal without hesitation or debate.

### Revert Decision Triggers
The Release Captain must trigger the reversal if:
- The production database CPU/Memory hits 100% and stays there for > 5 minutes, causing a site-wide outage.
- A critical security flaw is exploited (e.g., users can access the admin panel without logging in).
- A configuration error causes a redirect loop (`ERR_TOO_MANY_REDIRECTS`) on the primary domain.

### Rollback Criteria (How to Revert)
1. **Application Only (No DB Changes):** Use the hosting provider (e.g., Vercel) to instantly redeploy the previous successful commit to production.
2. **DNS Level:** If switching from a legacy site to the new site, update the domain's DNS A-records or CNAME to point back to the legacy infrastructure.
3. **Feature Flag Level:** If the launch was wrapped in a feature flag, simply toggle the flag to `false` in the production environment variables.

### Communication Steps
- **Internal:** Post `@here EMERGENCY ROLLBACK INITIATED` in the engineering Slack channel. Stop all other triage attempts.
- **External:** Once the rollback is complete, update the public status page to indicate the issue is resolved and the site is operating on the previous stable version.

### Post-Rollback
- Verify the rollback succeeded.
- Conduct a blameless post-mortem the following day to understand why the Final Review process failed to catch the issue. Do not attempt a second launch until the root cause is understood and the QA checklists are updated.
