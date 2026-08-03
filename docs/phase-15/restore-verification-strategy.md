# Restore Verification Strategy

## Proving the Fix Worked

A restore is not complete until the data integrity is verified. Assuming a database restore worked just because the command finished is a recipe for secondary outages.

### Automated Integrity Checks (Post-Restore)
Before routing public traffic to the newly restored database, run a suite of automated checks:
1. **Record Count Check:** Ensure the `movies` table has > 0 records and roughly matches the expected count from the snapshot metadata.
2. **Relationship Check:** Run a query to find any movies with orphaned relationships (e.g., a movie linked to a `genre_id` that no longer exists).
3. **Critical Data Check:** Assert that the Super Admin user account still exists and has the correct permissions.

### Media Integrity Checks
- After restoring the database, run a script that samples 100 random movies, pulls their `poster_url`, and executes a `HEAD` request against the CDN to verify the media actually exists in the restored state.

### Public Smoke Checks
- Temporarily route internal VPN traffic (or a specific preview domain) to the newly restored application.
- **QA Protocol:** An engineer must manually click through the Homepage, perform a Search, and click "Play Trailer" on a movie to ensure end-to-end functionality before flipping the DNS switch for the public.

### SEO Consistency Checks
- Ensure that the restored database does not accidentally contain outdated canonical URLs or missing `<title>` tags that were fixed between the snapshot time and the disaster. (Run the Phase 13 SEO automated tests against the restored staging environment).
