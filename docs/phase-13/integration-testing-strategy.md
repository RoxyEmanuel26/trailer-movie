# Integration Testing Strategy

## Testing the Seams

Integration tests verify that the different layers of the application communicate correctly. They are slower than unit tests but provide higher confidence.

### Scope of Integration Testing

1. **Database Interactions (Repository Layer):**
   - Tests run against a real, ephemeral test database (e.g., a Dockerized PostgreSQL instance spun up during CI).
   - Verify that creating a movie with genres correctly populates the junction tables (many-to-many relationships).
   - Verify that complex search queries return the expected records based on specific seed data.

2. **API Endpoint Verification (Route Handlers):**
   - Test the HTTP layer. Send a mock HTTP request to `/api/movies` and verify it returns a 200 OK with the correct JSON shape.
   - Send invalid payloads to verify the API returns a 400 Bad Request instead of crashing with a 500.

3. **Authentication & Authorization Flows:**
   - Send requests with invalid, expired, or missing JWTs/session tokens to protected admin endpoints and ensure they return 401/403.
   - Verify that a standard editor token cannot access a super-admin route.

4. **Cache Interactions:**
   - If using Redis, verify that calling an API endpoint twice results in a cache hit the second time.
   - Verify that publishing a new movie successfully issues a cache invalidation command for the homepage.

5. **Third-Party Mocks:**
   - When integrating with external APIs (like TMDB for movie data), integration tests should use mock servers (like MSW) to simulate external API responses, ensuring our system handles successful responses, timeouts, and rate limits correctly without hitting the real external API during testing.
