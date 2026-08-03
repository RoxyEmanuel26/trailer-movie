# Continuous Improvement Metrics

## Overview
To ensure the product is actually improving post-launch (and not just changing), we must track specific metrics that indicate health, growth, and stability.

## Core Metrics

### 1. Traffic and Search Growth
*   **Metric:** Month-over-month organic traffic growth.
*   **Metric:** Number of non-branded keywords ranking in the top 10 (Google Search Console).
*   **Goal:** Continuous upward trend indicates successful SEO maintenance and content curation.

### 2. Engagement Growth
*   **Metric:** Pages per session.
*   **Metric:** Trailer completion rate.
*   **Goal:** Increases indicate that recommendations, UX tweaks, and content quality are improving.

### 3. Error Reduction
*   **Metric:** Volume of unhandled exceptions per 10,000 sessions.
*   **Goal:** Should decrease over time as technical debt is repaid and edge cases are caught.

### 4. Performance Stability
*   **Metric:** Percentage of pages passing Core Web Vitals (specifically LCP under 2.5s and near-zero CLS).
*   **Goal:** Must remain stable (green) even as new features and heavier media are added.

### 5. Content Freshness
*   **Metric:** Time-to-publish for new trailers (time between official release and availability on the site).
*   **Metric:** Number of broken trailer links reported vs. fixed.
*   **Goal:** Indicates the efficiency of the admin team and automated sync scripts.

### 6. Admin Efficiency
*   **Metric:** Time taken to manually curate the homepage or add a custom movie entry.
*   **Goal:** Decreases indicate that the admin UX is improving and blocking issues are being resolved.

### 7. Incident Reduction
*   **Metric:** Mean Time Between Failures (MTBF) for SEV-1 and SEV-2 incidents.
*   **Metric:** Mean Time To Resolution (MTTR) for critical incidents.
*   **Goal:** MTBF should increase (fewer outages), and MTTR should decrease (faster fixes) as runbooks and alerting improve.
