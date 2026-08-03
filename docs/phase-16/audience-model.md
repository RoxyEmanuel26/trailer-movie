# Documentation Audience Model

## Who Are We Writing For?

Different stakeholders require vastly different levels of technical depth and operational context.

### 1. Future Developers
- **Needs:** Fast local setup guides, architectural component diagrams, code style guides, and API request/response schemas. They need to know how to add a feature without breaking existing ones.

### 2. AI Agents (Copilot, Cursor, etc.)
- **Needs:** Structured, predictable markdown files. High-level context (like Phase overviews) that can be ingested into a context window to help the AI understand the *rules* of the codebase before it generates code.

### 3. Project Owners / Product Managers
- **Needs:** High-level feature summaries, decision logs (to understand trade-offs), and QA checklists to verify that what was built matches what was requested.

### 4. Content Editors
- **Needs:** Step-by-step UI guides on how to publish a movie, upload a poster, handle bulk tagging, and revert a mistake. They do not need to know about the database schema.

### 5. Operations / DevOps Maintainers
- **Needs:** Deployment pipelines, secrets management strategies, infrastructure topology, and Disaster Recovery runbooks.

### 6. QA Testers
- **Needs:** E2E testing strategies, manual validation checklists, and environment boundaries.

### 7. Security & SEO Reviewers
- **Needs:** Clear documentation on where PII is stored, how authentication works, how canonical tags are generated, and where SEO overrides are implemented.
