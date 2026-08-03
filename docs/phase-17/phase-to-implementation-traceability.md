# Phase-to-Implementation Traceability

## Honoring the Architecture

Implementation must never become disconnected from the architectural design phases. 

### Source of Truth Mapping
- When writing the Prisma Schema -> The developer MUST consult **Phase 2 (Data Architecture)**.
- When writing the Auth Middleware -> The developer MUST consult **Phase 4 (Authentication)** and **Phase 10 (Security)**.
- When writing the `head` metadata -> The developer MUST consult **Phase 8 (SEO)**.

### Handling Conflicts
- If an implementing agent discovers that a decision in Phase 2 makes a requirement in Phase 7 impossible, the agent must **Stop**.
- The agent must not invent a workaround in code. They must raise the conflict, propose a solution, and update the relevant Phase document (adding an entry to the Decision Log) before continuing the implementation.

### Traceability Enforcement
- Every Pull Request description must explicitly state which Phase it is fulfilling (e.g., `Resolves Phase 3: API Layer Integration`).
- Reviewers use the designated Phase document as the rubric for approving the PR. If the code deviates from the document without justification, it is rejected.
