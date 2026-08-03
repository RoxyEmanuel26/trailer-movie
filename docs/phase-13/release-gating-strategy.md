# Release Gating Strategy

## The Approval to Ship

A release gate is a checklist that must be satisfied before new code can be deployed to production. This replaces subjective "I think it's ready" with objective "It has passed the criteria."

### Automated Blockers (The Hard Gates)
Deployment to Production is physically blocked by the CI/CD system if:
1. Unit or Integration tests fail.
2. E2E critical path tests fail on Staging.
3. The TypeScript compiler throws any type errors.
4. The linter (e.g., ESLint) reports any errors.
5. The automated Security vulnerability scan finds a "High" or "Critical" severity issue.

### Performance and SEO Gates
- The deployment is blocked if the automated Lighthouse CI run drops the Performance score below the established threshold (e.g., 90/100).
- The deployment is blocked if the static analysis detects missing canonical tags or incorrect robots directives.

### Manual Review Gates (The Soft Gates)
While automation handles the bulk of the work, a human must explicitly approve the release:
- **Code Review:** At least one other developer must have reviewed and approved the Pull Request.
- **Product Sign-off:** For major feature releases, a Product Manager or QA Lead must give a final "Thumbs Up" based on their review of the Preview/Staging environment, confirming the feature meets the business requirements.

### Bypass Protocol
In the event of a catastrophic production outage (e.g., the site is down), a "Break Glass" protocol must exist allowing a Senior Engineer to bypass the E2E tests and staging deployment to push a hotfix directly to production. This is heavily audited.
