# Documentation Quality and Governance

## Fighting Documentation Rot

Documentation that is wrong is worse than no documentation at all. It actively misleads developers and causes outages.

### The "Definition of Done"
- Updating documentation is not a separate, post-launch task. 
- **Rule:** A Pull Request that alters business logic, changes a database schema, or modifies deployment steps *must* include the corresponding documentation updates in the same PR. The reviewer must reject the PR if the docs are missing.

### Ownership of Canonical Docs
- While anyone can propose a change to the docs, the Tech Lead owns the architectural documents (`/docs/architecture/*`), and the Product Manager owns the user guides. They are responsible for reviewing changes to ensure accuracy.

### Detecting Stale Documentation
- Every major document should contain a `Last Updated: [Date]` or `Last Reviewed: [Date]` header.
- During quarterly maintenance (Phase 16), the Tech Lead should scan the `/docs` folder for any architectural documents that haven't been touched in over a year and verify if they are still accurate or need to be marked as `[DEPRECATED]`.

### Resolving Conflicts (Code vs. Docs)
- If the documentation says the API returns a `string`, but the TypeScript interface says it returns a `number`, **the code is always the source of truth.** The documentation must be immediately updated to reflect reality.

### Single Source of Truth
- Avoid duplicating information. Do not explain how to spin up the local database in the `README.md` *and* in the `database-architecture.md`. Explain it once in the setup guide, and link to it from everywhere else.
