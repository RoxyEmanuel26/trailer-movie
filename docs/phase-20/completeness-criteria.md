# Completeness Criteria

## Overview
"Complete" cannot be a subjective feeling. It must be defined by clear, observable criteria for each major area of the project.

## Area Criteria

### 1. Functional Completeness
*   **Sufficient:** All critical user flows (browse, search, view trailer) and admin flows (create, edit, delete movie) operate without unhandled exceptions.
*   **Insufficient:** "Coming Soon" placeholders on core navigation items; workflows that require developer intervention via the database.

### 2. Content Completeness
*   **Sufficient:** The database is populated with the agreed-upon initial dataset. No "Lorem Ipsum" text or broken image links exist on public-facing pages.
*   **Insufficient:** Missing metadata for featured movies; broken YouTube embeds on the homepage.

### 3. Workflow Completeness
*   **Sufficient:** Background jobs (e.g., daily API syncs) are scheduled, executing, and logging results properly.
*   **Insufficient:** Sync scripts must be run manually from a developer's terminal.

### 4. Security Completeness
*   **Sufficient:** All endpoints require appropriate authentication/authorization. API keys are managed via environment variables (not hardcoded).
*   **Insufficient:** Admin routes accessible without a valid session; unvalidated user input leading to potential XSS/SQLi.

### 5. SEO Completeness
*   **Sufficient:** Dynamic sitemap generates correctly. All movie pages have unique, populated `<title>` and `<meta name="description">` tags.
*   **Insufficient:** `noindex` tags accidentally left on the production environment.

### 6. Performance Completeness
*   **Sufficient:** Lighthouse scores for critical pages (Homepage, Movie Detail) meet agreed targets (e.g., >80 for Performance). Images are optimized and lazy-loaded.
*   **Insufficient:** Massive un-minified JavaScript bundles blocking the main thread; severe CLS on load.

### 7. Accessibility Completeness
*   **Sufficient:** Core workflows can be navigated via keyboard. Form inputs have labels. Contrast ratios meet WCAG AA standards for essential text.
*   **Insufficient:** Unlabelled icon buttons; focus traps preventing keyboard navigation.

### 8. Recovery Completeness
*   **Sufficient:** Automated database backups are confirmed to be running. A documented process exists for restoring from a backup.
*   **Insufficient:** Relying solely on the hosting provider's default backup without having tested a restore scenario.

### 9. Documentation Completeness
*   **Sufficient:** Architecture diagrams, API specs, and operational runbooks are up-to-date and stored centrally.
*   **Insufficient:** Documentation lives only in a departing developer's private notes or outdated Slack threads.

### 10. Operational Completeness
*   **Sufficient:** Error tracking (e.g., Sentry) is catching production errors. Analytics are recording traffic.
*   **Insufficient:** Code is deployed, but there is no visibility into whether it is failing silently.
