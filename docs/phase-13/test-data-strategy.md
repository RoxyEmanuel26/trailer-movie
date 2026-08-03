# Test Data Strategy

## The Foundation of Reliable Tests

Tests are only as reliable as the data they run against. Testing against a messy, constantly changing development database leads to flaky tests.

### Seed Data (The "Known State")
- We maintain a dedicated `seed.sql` or equivalent script that populates a completely fresh database with a known, fixed set of data.
- **Example:** The seed data always contains exactly one movie called "Test Matrix", one genre called "Test Action", and one Admin user.
- Tests assert against this known state (e.g., `expect(movies.length).toBe(1)`).

### Synthetic Data Generation
- For performance testing or UI pagination testing, we need lots of data.
- We use a factory library (like Faker.js) to generate 1,000 synthetic movies with random titles and lorem ipsum synopses on demand.

### Edge-Case Records
The seed data must include intentionally problematic records to verify the UI handles them gracefully:
- A movie with a title that is 200 characters long (to test UI truncation).
- A movie with no synopsis and no genres.
- A movie with a broken trailer link (to verify the error state displays correctly).

### Data Isolation
- E2E and Integration tests must run against isolated databases. Test A should not fail because Test B deleted a movie that Test A was expecting to find.
- In modern CI, this is achieved by spinning up ephemeral database containers for the duration of the test run, tearing them down immediately after.
