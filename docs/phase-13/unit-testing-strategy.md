# Unit Testing Strategy

## Scope of Isolation

Unit tests form the foundation of our CI pipeline. They must be fast, deterministic (never flaky), and run completely isolated from external services.

### What Must Be Unit Tested:

1. **Formatting and Utility Logic:**
   - Date formatters (e.g., converting an ISO string to "July 16, 2023").
   - Duration calculators (e.g., converting 135 minutes to "2h 15m").
   - Currency or box office formatters.

2. **Validation Logic:**
   - Testing Zod schemas or custom validation functions.
   - Example: Ensuring a function correctly rejects a malformed YouTube URL or requires a password to be > 8 characters.

3. **SEO Helper Logic:**
   - Functions that generate canonical URLs based on request paths.
   - Functions that assemble dynamic meta descriptions based on movie data. (A bug here damages search rankings).

4. **Workflow Decision Helpers:**
   - Testing the state machine logic for content management (e.g., `canPublish(draft)` should return false if `primary_poster` is null).

5. **Permission Logic:**
   - Functions that determine if a user has access to a specific action (e.g., `hasRole(user, 'senior_editor')`).

### What to Prioritize
Prioritize testing complex, branching business logic where edge cases are hard to reason about. Do not prioritize testing basic getter/setter functions or UI wrappers that contain no logic.
