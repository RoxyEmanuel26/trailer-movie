# Content Integrity Testing

## Data Quality Assurance

Bad data breaks UIs. Content integrity testing verifies that the database remains in a valid, expected state.

### Automated Integrity Checks

1. **Missing Required Fields (Database/ORM level):**
   - Integration tests must verify that bypassing the application layer and trying to write a `Published` movie directly to the database without a title fails database constraints or strict ORM validations.

2. **Duplicate Slug Detection:**
   - Test the slug generation logic to ensure that creating a second movie called "Dune" results in `dune-1` or throws a clear conflict error, rather than crashing with a 500 error due to a unique index violation.

3. **Relationship Integrity (Foreign Keys):**
   - Try to delete a Genre that is assigned to 10 movies. The database layer tests must verify that this action is blocked (Restrict) or handled safely (Set Null), rather than creating orphaned records.

4. **SEO Field Validation:**
   - Verify that SEO overrides actually work. If an editor sets a custom `meta_title`, the API must return that custom title; if null, it must return the generated fallback title.

5. **Draft/Published Leakage:**
   - Ensure that calling the public `GET /api/movies` endpoint *never* returns movies in the `Draft` state. This is a critical privacy and embargo test.

### Routine Data Audits (Background Tasks)
- While not a traditional "test script," the architecture should include a weekly background job that scans the live database for broken media references (e.g., a poster URL that now returns a 404) or invalid YouTube trailer IDs, reporting them to a dashboard.
