# Rollback-Oriented Planning

## Designing for Reversal

Every PR merged to the main branch must be built with the assumption that it might cause a critical production outage and need to be reverted immediately.

### Forward-Only Database Migrations
- Standard application code can be reverted instantly. Database schema changes cannot.
- **Strategy:** Isolate schema changes. If you need to rename a column from `title` to `movieTitle`, you do not do it in one PR.
  1. **PR 1:** Add the new `movieTitle` column. (Deploy).
  2. **PR 2:** Update the app to write to *both* columns, but read from `title`. (Deploy).
  3. **PR 3:** Backfill old data. (Run script).
  4. **PR 4:** Update the app to read from `movieTitle`. (Deploy).
  5. **PR 5:** Drop the old `title` column. (Deploy).
- This multi-step process ensures that at any point, a rollback of the application code will not crash because the database schema is incompatible.

### Avoiding Coupled Releases
- Never plan a release that requires coordinating simultaneous deployments across two different codebases (e.g., deploying the Frontend Vercel app at the exact same minute as the Backend Heroku app).
- APIs must be updated to support *both* the old frontend and the new frontend, deployed first, and then the new frontend can be deployed independently.
