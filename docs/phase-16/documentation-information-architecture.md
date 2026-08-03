# Documentation Information Architecture

## Organizing the Knowledge Base

Documentation will live directly in the Git repository under a dedicated `/docs` folder to ensure it is versioned alongside the code.

### Folder Structure
```text
/docs
  /architecture      # System design, Phase documents, tech stack
  /runbooks          # DR, deployment, troubleshooting step-by-steps
  /api-reference     # OpenAPI specs, DB schema graphs
  /guides            # User guides, CMS workflow tutorials
  /logs              # Decision logs (ADRs), changelogs
  README.md          # The Entry Point
```

### The Entry Point (README.md)
The root `README.md` must be the absolute starting point for anyone touching the repository. It contains:
1. A 2-sentence summary of the project.
2. The exact commands to run the project locally.
3. Links to the primary sub-directories in `/docs`.

### Cross-Linking & Discovery
- Markdown files must use relative links to connect related concepts (e.g., the `deployment-guide.md` should link directly to the `rollback-runbook.md`).
- We avoid deep nesting (keep it flat: mostly 1 level deep inside `/docs`) to ensure high searchability using standard IDE tools (Cmd+P).

### Canonical vs. Supporting
- **Canonical:** The `schema.prisma` file is the canonical source of truth for the database.
- **Supporting:** `database-architecture.md` is supporting documentation that explains *why* the schema is structured that way, but it should not attempt to list every single column (which rots quickly).
