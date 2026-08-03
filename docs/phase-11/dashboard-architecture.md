# Dashboard Architecture

## Reporting Surfaces

Data is useless unless it is visible to the right people in an understandable format.

### Executive Summary Dashboard
- **Audience:** Management, Product Owners.
- **Metrics:** High-level KPIs. Total daily visitors, total trailer plays, overall site uptime, top 5 trending movies.
- **Focus:** Quick health checks and high-level trends.

### Content Performance Dashboard
- **Audience:** Content Editors, Marketing.
- **Metrics:** Detailed breakdown of movie engagement, view-to-play conversion rates, zero-result searches, filter usage.
- **Focus:** Identifying what content to acquire or promote next.

### Search Analytics Dashboard
- **Audience:** Product Managers, Search Engineers.
- **Metrics:** Top search terms, zero-result terms, search latency, search refinement paths.
- **Focus:** Improving the discovery experience.

### SEO Dashboard
- **Audience:** SEO Specialists, Marketers.
- **Metrics:** Organic landing page volume, correlation between Core Web Vitals and traffic, programmatic page performance.
- **Focus:** Validating organic growth strategies.

### Admin Activity Dashboard
- **Audience:** Super Admins, Security.
- **Metrics:** Volume of edits, failed login attempts, recent bulk operations.
- **Focus:** Operational oversight and security auditing.

### System Health Dashboard
- **Audience:** Developers, DevOps.
- **Metrics:** P99 API latency, error rates, CPU/Memory usage, cache hit ratios.
- **Focus:** Identifying and resolving technical bottlenecks.
