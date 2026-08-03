# Implementation Verification Strategy

## Validating the Waves

Before closing an Implementation Wave and moving to the next, the output must be verified against a strict rubric.

### 1. Functional Checks
- Does the code fulfill the business requirements? (e.g., Can an editor actually upload a poster?)
- **Verifier:** Manual QA or E2E automated tests (Playwright/Cypress).

### 2. Regression Checks
- Did building the Public Homepage accidentally break the Admin Login?
- **Verifier:** The CI pipeline running the unit and integration test suite (Phase 13) before the PR is allowed to merge.

### 3. Performance Checks
- Did the new feature violate the latency budget?
- **Verifier:** Vercel/Lighthouse CI analyzing the PR preview branch. If the new Video Player component drops the Performance Score below 90, the wave is not complete.

### 4. Security Checks
- Were any new API endpoints exposed without authentication?
- **Verifier:** Peer review explicitly checking the middleware configuration.

### 5. SEO Checks
- Did the new dynamic routing logic break the canonical URLs?
- **Verifier:** Automated SEO linting or a manual crawl of the staging environment using Screaming Frog.

### The "Done" Definition
A wave is not "Done" when the developer opens a PR. It is "Done" when all verification checks pass and the code is running successfully on the Staging environment.
