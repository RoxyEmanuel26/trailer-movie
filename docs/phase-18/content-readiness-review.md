# Content Readiness Review

## Validating the Catalog

An empty or broken catalog makes a terrible first impression. The database must be primed before public users arrive.

### Minimum Volume Requirements
- The site must not launch with empty categories. 
- **Requirement:** At least 50 fully populated movies must be published. Every core genre (Action, Comedy, Horror, etc.) must have at least 3 associated movies.

### Missing/Broken Content Detection
- **Check:** Run a database query to find any `Published` movies that have a `null` or broken `poster_url`.
- **Check:** Run a script to ping all YouTube embed URLs to ensure the source videos haven't been taken down prior to launch.

### Placeholder Cleanup
- **Check:** Search the database for exact strings like "Lorem Ipsum", "Test Movie", or "asdf". Delete or revert these records.
- **Check:** Ensure the Homepage carousel is featuring real, high-quality hero images, not development placeholders.

### Static Page Completeness
- Verify the "About Us," "Terms of Service," and "Privacy Policy" pages contain legally reviewed, final copy, and all mailto/contact links are functional.
