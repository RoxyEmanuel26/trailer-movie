# Test Pyramid Strategy

## Effort Distribution

We follow a balanced testing pyramid to optimize for speed of execution and confidence in the system.

### 1. Unit Tests (The Base)
- **Volume:** High.
- **Speed:** Milliseconds.
- **Role:** Verify pure functions, formatting logic, complex state reducers, and individual UI components in isolation.
- **Avoid:** Do not test database connections or network requests here. Use mocks heavily.

### 2. Integration Tests (The Middle)
- **Volume:** Medium.
- **Speed:** Seconds.
- **Role:** Verify that components work together. Test the database layer against a real test database (e.g., checking that a repository correctly inserts and retrieves a movie record). Test API endpoints using Supertest or similar tools to verify route handlers and middleware (auth) work in tandem.

### 3. End-to-End (E2E) Tests (The Peak)
- **Volume:** Low (Critical Paths Only).
- **Speed:** Minutes.
- **Role:** Drive a real browser (e.g., using Playwright or Cypress) against a fully deployed staging environment. Verifies that the frontend, backend, database, and third-party APIs all function as a complete system.
- **Avoid:** Do not use E2E to test every possible edge case (too slow and flaky); use it for the "Happy Paths" (e.g., searching for a movie, clicking it, and playing the trailer).

### 4. Manual QA & Exploratory Testing (The Top)
- **Volume:** Very Low.
- **Role:** Humans looking at the UI to catch layout bugs across weird device sizes, checking the "feel" of animations, and performing exploratory testing on new, complex features before writing automated tests for them.

### Snapshot / Visual Testing
- Used selectively to lock down the exact HTML output of critical SEO components (like the `<head>` metadata block) to catch accidental regressions.
