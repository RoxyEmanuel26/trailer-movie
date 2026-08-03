# Developer / AI Agent Work Contract

## Rules of Engagement

Any human developer or AI coding agent executing this architecture must abide by the following strict contract. Violating these rules invalidates the architecture.

1. **Read Before Writing:** The agent must explicitly state (or the developer must confirm) that they have read the relevant Phase documentation before writing any code for that domain.
2. **Scope Containment:** The agent must only execute the specific task requested. If asked to "Implement the Movie UI," the agent must NOT simultaneously attempt to refactor the database connection pooling.
3. **No Uncontrolled Refactors:** "Drive-by" refactoring is banned during the initial implementation waves. It introduces scope creep and breaks integration checkpoints.
4. **Halt on Missing Dependencies:** If the agent is instructed to build the Search API, but the Elasticsearch/Meilisearch infrastructure is not yet provisioned, the agent must STOP and explicitly request the dependency be resolved, rather than mocking it out and leaving technical debt.
5. **Record Deviations:** If a minor deviation from the architecture is absolutely necessary (e.g., a specific NPM package is deprecated), the agent must document this deviation immediately in the PR description and the Decision Log.
