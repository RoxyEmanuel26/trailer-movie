# Recovery Time and Recovery Point Expectations

## Defining Success Metrics

Continuity targets set the expectations for the business and dictate the necessary engineering investment.

### Recovery Point Objective (RPO)
*How much data are we willing to lose?*
- **Primary Database:** **Maximum 5 minutes.** (Achieved via Point-in-Time Recovery / WAL streaming).
- **Media Assets:** **Maximum 1 hour.** (Achieved via asynchronous cross-region replication).
- **Analytics/Logs:** **Maximum 24 hours.** We can tolerate losing a day of pageview data in a catastrophic scenario; it does not break the core product.

### Recovery Time Objective (RTO)
*How long can the site be down before it severely impacts the business?*
- **Public Site (Read-Only):** **Under 1 hour.** If the database dies, the CDN should continue serving stale cached HTML for the homepage and movie details (Stale-While-Revalidate). The site appears "up" to public users, though search/filtering may fail.
- **Full System Restoration (Total Disaster):** **Under 4 hours.** This includes spinning up a new database from a snapshot, verifying it, updating DNS/secrets, and redeploying the application.
- **Admin Dashboard (Writes):** Can tolerate longer downtime (**up to 8 hours**) during a disaster. Public read access is always prioritized over internal write access.

### Relative Priorities
1. **Critical:** Homepage, Movie Detail Pages, Trailer Playback (Must recover first).
2. **High:** Search and Genre Filtering.
3. **Medium:** Admin CMS functionality (Publishing new movies).
4. **Low:** Analytics dashboards, background metadata sync jobs.
