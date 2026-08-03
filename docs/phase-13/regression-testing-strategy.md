# Regression Testing Strategy

## Preventing Backward Steps

Regression testing ensures that fixing a bug or adding a feature today doesn't break a feature that was working yesterday.

### The CI/CD Pipeline (The First Line of Defense)
- **Continuous Integration:** Every time a developer opens a Pull Request (PR), the CI server automatically runs the entire Unit and Integration test suite. 
- **Requirement:** A PR cannot be merged into the `main` branch if any test fails. This immediately catches 80% of regressions.

### Critical Path Regression (E2E)
- Before a release is cut, the E2E test suite (which covers the Critical User Journeys) is executed against a Staging environment.
- If the "Trailer Playback" E2E test fails, the release is blocked.

### Bug Fix Protocol (The "Test-Driven" Rule)
- When a bug is discovered in production, the workflow dictates:
  1. Write a failing automated test that reproduces the bug.
  2. Fix the code until the test passes.
  3. Merge.
- This ensures that this specific bug can *never* occur again without the CI pipeline catching it, continuously expanding the regression safety net.

### SEO Regression
- We do not rely solely on Google Search Console to tell us we made a mistake (which can take weeks). The automated SEO checks (Phase 13, Section 10) run on every build to prevent deploying `<meta name="noindex">` to production.
