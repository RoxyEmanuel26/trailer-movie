# Phase 16 Decision Log

## Documentation & Maintenance Decisions

This document records the major strategic decisions made regarding how the project is documented and maintained.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Docs Live in the Git Repo** | Ensures documentation is version-controlled alongside the code that it describes. Prevents "Docs drift" common with external Wiki tools (like Confluence or Notion). | Less accessible to non-technical stakeholders who aren't comfortable navigating GitHub. |
| **Code Over Schema Tables** | We will not manually maintain markdown tables of database columns. ORM files and auto-generated OpenAPI specs are the source of truth. | Requires setting up automated generation tools in the CI pipeline; manual writers must resist the urge to document schemas in Markdown. |
| **Decision Logs (ADRs)** | Required for all major tech stack and architecture changes. Prevents the team from repeatedly arguing about settled choices. | Adds friction to the decision-making process; requires discipline to write them before acting. |
| **Rollback First Policy** | Documented in Troubleshooting. If an issue occurs within 15 mins of deploy, immediately roll back. Do not attempt "hotfixes." | May temporarily revert a much-needed feature, but guarantees stability and SLA compliance. |
| **Docs in the PR 'Definition of Done'** | No PR is merged if it introduces a feature or changes logic without updating the associated documentation. | Slows down PR merge times and requires stricter peer review. |
