# Documentation Philosophy

## Guiding Principles for Project Knowledge

Documentation is the memory of the project. Without it, the project relies entirely on the oral history of its original creators, which inevitably fades or leaves the company.

### Why Documentation Matters
- It reduces the "Time to First Commit" for new engineers.
- It prevents the same architectural mistakes from being made twice.
- It provides context for AI agents assisting in maintenance.

### What Must Never Be Lost
- **"Why" over "What":** The code explains *what* it does. Documentation must explain *why* it was done that way (e.g., "Why did we choose PostgreSQL over MongoDB for the movie catalog?").
- **Infrastructure Topology:** How the pieces connect in production.

### Detailed vs. Concise
- **Detailed:** Setup instructions, Disaster Recovery Runbooks, and Security protocols must be exhaustively detailed step-by-step.
- **Concise:** Architecture overviews and feature descriptions should be concise and highly skimmable to allow rapid mental modeling.

### Avoiding Documentation Rot
- Documentation must live as close to the code as possible (in the same Git repository).
- Updating documentation must be part of the "Definition of Done" for any Pull Request. If a PR changes a feature's behavior but doesn't update the associated docs, it is rejected.
