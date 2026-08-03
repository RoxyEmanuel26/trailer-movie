# Database Deployment Strategy

## Safe Schema Evolution

Database changes are the most dangerous part of any deployment. Code can be rolled back instantly; data schema changes cannot.

### Migration Rollout Expectations
- Database schemas must be managed entirely through code-based migrations (e.g., Prisma Migrations, Drizzle, Flyway).
- Migrations must be committed to version control and run automatically during the CI/CD pipeline *before* the new application code boots up.

### Backward-Compatible Migration Preference
- **Rule:** All database schema changes must be backward-compatible with the *currently running* version of the application.
- **Why:** During a zero-downtime deployment, the new database schema will exist for a few minutes while the old application code is still serving traffic.
- **Example:** If renaming a column from `desc` to `description`, do not rename it in one step. 
  1. Release 1: Add `description`, write to both.
  2. Release 2: Read from `description`.
  3. Release 3: Drop `desc`.

### Rollback Concerns
- Do not write "Down" migrations (e.g., scripts to reverse a schema change).
- If a deployment fails due to a bad schema change, rolling back the database schema is highly risky and often causes data loss (e.g., dropping a newly created table drops user data).
- **Strategy:** "Roll Forward." If a migration causes an issue, the application code is rolled back, but the database schema remains. The schema change (if backward compatible) will not break the old code. A new PR is opened to fix the issue.

### Seed Data
- Maintain a robust `seed.ts` script that can populate an empty database with necessary roles, taxonomy, and dummy movies. This is critical for spinning up new Preview environments reliably.
