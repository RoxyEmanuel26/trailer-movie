# Testing Philosophy

## Guiding Principles for QA

The testing architecture for the movie trailer platform is designed to provide high confidence for continuous delivery without paralyzing development speed.

### Purpose of Testing
Testing exists to protect the user experience and the business value (SEO, engagement) from regressions. It is a safety net that allows developers to ship features quickly, knowing critical paths are guarded.

### Risk-Based Prioritization (What to test first)
We prioritize testing based on business risk:
1. **Critical User Journeys (CUJs):** Can a user find and play a trailer? (Must be heavily tested).
2. **Data Integrity:** Can an admin save a movie without data corruption?
3. **SEO Integrity:** Are the metadata and canonical tags rendering correctly on public routes?

### Heavy vs. Light Testing
- **Heavy:** Core API endpoints, authentication flows, and public video playback logic require extensive automated coverage.
- **Light:** Purely cosmetic UI components (e.g., the exact pixel padding of a button) should not have brittle automated tests; they are better suited for light manual review or visual regression testing.

### The Unreleasable Baseline
Code should *never* be released if:
- It breaks trailer playback.
- It degrades Core Web Vitals significantly (failing Performance budgets).
- It breaks organic indexability (SEO checks fail).

### Avoiding Over-Testing
Do not write tests that simply assert a framework works (e.g., testing that React renders a `div` when you tell it to). Avoid testing internal implementation details; test public interfaces and observable behaviors to prevent brittle tests that break on every refactor.
