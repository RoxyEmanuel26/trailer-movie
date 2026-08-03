# Operational Cadence

## Overview
A consistent operational rhythm ensures that maintenance tasks are not neglected and that the product remains healthy over time. 

## Daily Checks
**Focus:** Immediate stability, security, and critical content health.
*   Review high-severity error logs (Sentry/Datadog) for new spikes.
*   Check uptime and response time dashboards.
*   Verify automated backup successes (database and assets).
*   Review security or abuse alerts (e.g., unusual login attempts).
*   Ensure homepage featured content is loading correctly.

## Weekly Checks
**Focus:** Content freshness, short-term trends, and minor triage.
*   Triage and prioritize the bug backlog (assign to upcoming sprints).
*   Review weekly traffic and engagement trends (Google Analytics/Plausible).
*   Check for broken links or missing media assets (especially new trailers).
*   Review new user feedback and support tickets.
*   Update movie metadata and trailers for upcoming releases.

## Monthly Checks
**Focus:** SEO, performance, security patching, and technical debt.
*   **SEO:** Review Google Search Console for indexing errors, core web vitals issues, and keyword performance changes.
*   **Performance:** Analyze monthly page load times and bundle sizes. Identify areas for optimization.
*   **Security:** Review dependency vulnerabilities (e.g., `npm audit`) and schedule necessary updates.
*   **Database:** Monitor database size, slow queries, and index usage.
*   **Planning:** Review the feature backlog and select items for the next development cycle.

## Quarterly Checks
**Focus:** Strategic alignment, major system upgrades, and long-term health.
*   Conduct a full security audit, including IAM permissions and secret rotations.
*   Review the technical debt backlog and allocate dedicated time for refactoring.
*   Evaluate infrastructure costs and optimize resource allocation.
*   Assess third-party API usage (e.g., TMDB) against rate limits and billing.
*   Hold a retrospective on the post-launch process and update runbooks as needed.

## Ad-Hoc Incident Response
**Focus:** Immediate resolution of critical outages.
*   Triggered automatically by alerting systems (e.g., site down, payment gateway failure).
*   Supersedes all other scheduled tasks until resolved.
*   Follows the Incident Triage Workflow.

## Release Cycle Rhythm
*   **Routine Updates:** Deployed weekly or bi-weekly. Includes low-risk bug fixes, UI tweaks, and SEO optimizations.
*   **Major Features:** Deployed on an as-needed basis, typically monthly, following rigorous staging and QA.
*   **Hotfixes:** Deployed immediately for critical bugs or security vulnerabilities.
