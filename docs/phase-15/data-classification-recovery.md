# Data Classification for Recovery

## Prioritizing What Matters

Different types of data require different recovery strategies based on their criticality and ability to be reproduced.

### 1. Core Application & Content Data (Critical - Backup Required)
- **Includes:** Movies, Cast, Genres, Taxonomy, Editorial Notes, User Accounts (Admins).
- **Strategy:** Must be aggressively backed up (Daily + Point-in-Time Recovery). Loss of this data represents a total loss of business value.

### 2. Media Assets (Critical - Backup Required)
- **Includes:** Uploaded original posters, backdrops, custom video files.
- **Strategy:** Must be replicated (e.g., Cross-Region Replication in S3). These are binary files that cannot easily be recreated if lost.

### 3. Configuration & Secrets (Critical - Backup Required)
- **Includes:** Environment variables, API keys, IaC templates.
- **Strategy:** Stored in a secure, version-controlled Secret Manager. IaC templates must be in Git. 

### 4. Analytics & Audit Logs (Important - Backup Required)
- **Includes:** Pageview aggregates, editor action logs (Phase 11).
- **Strategy:** Backed up, but with lower priority during a disaster. We will restore the main site first, and restore analytics data later.

### 5. Search Indexes (Disposable - Do Not Backup)
- **Includes:** Typesense/Elasticsearch index data.
- **Strategy:** Do not back up. If the index is corrupted, it is faster and safer to trigger a full re-index script from the primary relational database.

### 6. Caches (Disposable - Do Not Backup)
- **Includes:** Redis cache, CDN Edge Cache, Next.js Data Cache.
- **Strategy:** Do not back up. Upon restoration, the caches will naturally rebuild as new traffic hits the origin server.
