# Routine Maintenance Tasks

## The Recurring Checklist

To keep the platform secure, fast, and stable, specific tasks must be executed on a recurring schedule.

### Weekly Tasks
- **Error Log Review:** Review Sentry/Bugsnag for new, non-fatal errors that are occurring frequently and create tickets to resolve them.
- **Content Cleanup:** Check for movies missing primary assets or broken YouTube links via a custom admin report.

### Monthly Tasks
- **Dependency Updates:** Run `npm outdated`. Update minor/patch versions of dependencies. Ensure tests pass before merging.
- **Security Patch Review:** Run `npm audit` and resolve any critical or high vulnerabilities immediately.
- **Performance Check:** Run a Lighthouse audit on the Production homepage to ensure LCP and CLS have not degraded.
- **Cloud Cost Review:** Check the billing dashboard. Ensure CDN bandwidth, Serverless compute, and database storage are within expected budgets.

### Quarterly Tasks
- **Backup Verification (Fire Drill):** Execute the Disaster Recovery Runbook (Phase 15). Spin up a staging database from a snapshot to prove backups are functioning.
- **Admin Account Audit:** Review the list of users with Admin or Super Admin access. Revoke access for any departed employees or contractors.
- **SEO Health Check:** Review Google Search Console for any new indexing errors or spikes in 404s.

### Annual Tasks
- **Major Framework Upgrades:** Plan and execute major version upgrades (e.g., upgrading to the next major version of Node.js or the core frontend framework).
