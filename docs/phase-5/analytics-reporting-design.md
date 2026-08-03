# Analytics & Reporting Design

While external tools (Google Analytics, Plausible) handle deep traffic analysis, the admin panel must surface actionable product insights natively.

## 1. Content Performance Metrics
- **Top Trailers:** Which movies are getting the most trailer clicks? (Sourced from our internal `trailer_play` tracking events).
- **Zero-Click Searches:** What are users searching for that yields 0 results? (Crucial for identifying gaps in the catalog).

## 2. System Operations Reporting
- **Sync Job Outcomes:** A table showing the results of the nightly TMDB cron jobs. "Processed: 1,200. Succeeded: 1,195. Failed: 5." Clicking "Failed" shows exactly which TMDB IDs triggered errors, allowing admins to fix them manually.
- **Trailer Health:** A report from the YouTube API checker showing all trailers that recently went private or were deleted.

## 3. UI Implementation
- Data should be presented in simple line charts and data tables.
- Date range pickers (Last 7 Days, Last 30 Days) are essential.
- Avoid overcomplicating this section; if deep funnel analysis is needed, the admin should be directed to the external GA4/Mixpanel dashboard.
