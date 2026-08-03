# Phase 13 Decision Log

## QA and Testing Decisions

This document records the major strategic decisions made during Phase 13 regarding how quality will be ensured.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Limiting E2E to Critical Paths Only** | E2E tests are slow, expensive to run, and prone to flakiness (e.g., failing because a network request took 10ms too long). We rely on integration tests for edge cases. | A obscure UI bug deep in a user profile menu might slip through to production, requiring a hotfix. |
| **Testing Against Real (Ephemeral) Databases** | Mocking the ORM/Database layer often results in tests that pass even when the actual SQL query is broken. Testing against a real database instance provides true confidence. | CI runs take slightly longer because they have to spin up a Docker container and run database migrations before the test suite starts. |
| **Blocking Deploys on SEO / Web Vitals** | SEO and Performance are the lifeblood of a public content site. A regression here is just as bad as a 500 error. | Deployments might be blocked by seemingly "minor" issues (e.g., an image was added without optimization), requiring developer intervention. |
| **Selective Visual Regression Testing** | Visual testing the entire dynamic homepage leads to constant false positives as content changes daily. Restricting it to isolated components (Storybook) is more stable. | Accidental CSS changes that break the layout of dynamic content might only be caught by manual QA or user reports. |
| **The "Bug Fix" Test Protocol** | Forcing developers to write a test *before* fixing a production bug ensures the regression suite actively covers real-world problems. | Slows down the initial time-to-resolution for a hotfix slightly, but saves massive time in the long run. |
