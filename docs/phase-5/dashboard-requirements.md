# Dashboard Design Requirements

The Dashboard is the landing page for all admin users. It must act as a status monitor, not just a welcome screen.

## 1. Content Health Indicators
- **Missing Assets:** "14 Movies missing Posters" or "45 Movies without Trailers." These act as to-do lists for Content Editors.
- **Broken Links:** "3 Trailers marked as inactive by YouTube check." (Critical alert).

## 2. Sync Status & System Health
- **Last TMDB Sync:** "Last successful batch sync: 2 hours ago."
- **Failed Jobs:** Alert if the nightly cron job failed (e.g., due to TMDB API limits).

## 3. Pending Edits & Reviews
- **Drafts:** "12 Movies currently in Draft status."
- **Recent Actions:** A mini-feed of the Audit Log showing what other admins are actively working on (e.g., "Sarah updated Dune: Part Two").

## 4. Quick Actions
- A sticky "Import from TMDB" search bar directly on the dashboard.
- A "Clear Cache" button (if the user has the Super Admin role).

## 5. High-Level Metrics (For Analysts/Super Admins)
- 24-hour page views, top searched terms, most played trailers. (Requires Analytics role).
