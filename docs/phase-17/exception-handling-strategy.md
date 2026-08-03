# Exception Handling Strategy

## When the Plan Fails

No plan survives first contact with the compiler perfectly. When the orchestration plan hits a roadblock, a formalized exception process prevents chaotic workarounds.

### 1. Missing Dependencies
- **Scenario:** The frontend developer is assigned to build the Movie page, but the backend API is delayed.
- **Action:** Halt frontend implementation. Do *not* build massive mock-data layers that will require extensive rewriting. Pivot the developer to a different, unblocked wave (e.g., SEO static pages) until the dependency is resolved.

### 2. Conflicting Design / Technical Constraints
- **Scenario:** Phase 7 (Performance) requires Edge caching, but the Phase 4 (Auth) implementation requires reading a session cookie on every request, which busts the cache.
- **Action:** Escalate to the Tech Lead immediately. Do not implement a "hack" in the code. The Tech Lead must decide which architectural priority wins (e.g., relaxing Auth on public pages to preserve caching) and update the Decision Log (Phase 16).

### 3. Scope Change Handling
- **Scenario:** The client urgently requests a "User Comments" feature midway through Wave 4.
- **Action:** Reject the injection into the current wave. The feature must be architected first (Data, UI, Security for XSS) and added as a *new* Wave appended to the end of the orchestration sequence.

### Documenting Deviations
Any architectural change made during implementation must be recorded as an ADR (Architecture Decision Record) before the PR is merged.
