# Backup Scope Strategy

## Defining the Backup Boundary

To ensure reliable and fast recovery, we must precisely define what is captured in our backup routines.

### Included in the Backup Scope
1. **Primary Database Storage Volume:** The complete state of the relational database (e.g., Postgres), including all tables, constraints, and indexes.
2. **Media Storage Bucket:** The complete contents of the primary Object Storage bucket containing user-uploaded assets.
3. **Infrastructure Configuration:** A snapshot of current environment variables, DNS records, and routing rules (typically managed via Git/IaC, not traditional backups).
4. **Auth Provider State:** If using an external auth provider (like Auth0 or Supabase Auth), their automated user-state backups must be confirmed as active.

### Excluded from the Backup Scope
1. **Application Source Code:** The codebase is managed in Git (GitHub/GitLab). It does not need a separate operational backup script; the Git provider handles redundancy.
2. **Node_Modules / Dependencies:** We do not back up installed libraries. They are re-downloaded via `npm install` during the build process.
3. **Derived Analytics Datasets:** We back up the raw events, but not the materialized views (e.g., "Top 10 Movies This Week"), as these can be recalculated from the raw data.
4. **Staging & Preview Environments:** We do *not* back up the data in Staging or Preview environments. They are disposable and can be reseeded on demand.
