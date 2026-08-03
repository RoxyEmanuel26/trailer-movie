# Incremental Delivery Strategy

## The Anti-Big-Bang Approach

Large, unverified changes are the enemy of stability. Work must be broken down into the smallest meaningful deliverable units.

### Defining "Meaningful Units"
- A "Meaningful Unit" is not "The Database."
- A "Meaningful Unit" is "The Movie Taxonomy Schema Migration." It can be deployed, verified, and rolled back independently of the User Accounts schema.

### Preventing Large Unverified Changes
- **PR Size Limits:** Pull Requests should ideally be under 400 lines of code. If an implementation task (like building the Homepage) requires 2,000 lines, it must be broken into smaller PRs (e.g., PR 1: Hero Component, PR 2: Carousel Component, PR 3: Data Fetching).
- **Hidden Commits:** Code can be merged to the `main` branch even if the UI isn't finished, provided it is hidden behind a Feature Flag or is an isolated backend API route that nothing calls yet.

### Reversibility
- Every increment must be safely reversible. If PR 2 breaks Staging, we can instantly `git revert` PR 2 without breaking the database schema deployed in PR 1.
- This requires strict avoidance of tightly coupled releases (e.g., "The frontend code will crash unless the backend code is deployed at the exact same millisecond").
