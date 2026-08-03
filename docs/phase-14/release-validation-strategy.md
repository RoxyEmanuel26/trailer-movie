# Release Validation Strategy

## Checking Our Work

Validation occurs immediately before and immediately after a release to ensure the deployment was successful and didn't break critical paths.

### Pre-Deployment Checks (The Gates)
Before the artifact is allowed to replace the live production version:
- **Test Suite:** Unit, Integration, and E2E tests must pass (covered in Phase 13).
- **Security Scan:** No critical CVEs detected in dependencies.
- **Build Output:** The build step completed successfully without missing assets.

### Post-Deployment Checks (Smoke Tests)
Immediately after traffic is routed to the new release, an automated script runs against the live Production URL:
1. **Health Check:** `GET /api/health` returns 200 OK.
2. **Route Check:** The Homepage returns 200 OK and contains a specific known DOM element (e.g., `<main id="app-root">`).
3. **SEO Check:** The Homepage `<head>` contains a `<title>` and does *not* contain `noindex`.
4. **Auth Check:** The `/admin/login` page loads successfully.

### Rollback Trigger
- If any of the Smoke Tests fail, the deployment script should automatically trigger an instant rollback to the previous version and alert the engineering team.

### Ongoing Validation (Monitoring)
For the first 15 minutes after a release, the team monitors the dashboards:
- **Error Rate Check:** Is Sentry reporting a spike in 500 errors?
- **Performance Check:** Has the p95 response time for the API increased significantly compared to 1 hour ago?
