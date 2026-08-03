# API Testing Strategy

## Contract and Behavior Verification

The API layer is the contract between the frontend (public or admin) and the database. It must be rigidly tested to prevent unexpected UI breakages.

### Testing Scope

1. **Response Shape Contracts:**
   - Assert that public endpoints (e.g., `GET /api/movies/:id`) return exactly the expected JSON schema.
   - Crucially, assert that they do *not* leak sensitive internal fields (e.g., `internal_notes`, `admin_who_created_it`, or soft-delete flags).

2. **Input Validation Behavior:**
   - Send payloads missing required fields, containing invalid types (e.g., string instead of integer), or containing malicious injections.
   - Assert the API returns a structured 400 Bad Request with actionable validation error messages.

3. **Pagination Behavior:**
   - Seed the database with 25 movies.
   - Request `?limit=10&page=1`. Assert 10 items returned.
   - Request `?limit=10&page=3`. Assert 5 items returned.
   - Request `?limit=1000`. Assert the API truncates to a safe maximum (e.g., 100) to prevent denial-of-service via massive DB queries.

4. **Rate Limiting Behavior:**
   - In a test environment, lower the rate limit threshold (e.g., to 5 requests per second).
   - Fire 6 rapid requests. Assert the 6th request returns a `429 Too Many Requests`.

5. **Search and Filtering:**
   - Test complex queries combining full-text search with genre filters (e.g., `?q=matrix&genre=action`). Verify the database query builder correctly applies all `WHERE` clauses.
