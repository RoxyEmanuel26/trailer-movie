# Orchestration Philosophy

## The Blueprint for Execution

The architecture defines *what* we are building. The orchestration plan defines *how* we build it. A flawless architecture can still fail if implemented in the wrong order.

### Principles of Safe Execution
- **Dependency-First:** Never build a consuming layer before the producing layer is stable. You cannot build the Admin UI until the API exists; you cannot build the API until the Database schema is approved.
- **Incremental Verification:** Code must be merged and verified in small, functional slices. Building the entire backend over 3 weeks and attempting a "Big Bang" integration with the frontend on day 22 is strictly forbidden.
- **Architecture Alignment:** The implementation phase is not a time for architectural brainstorming. If a developer or AI agent encounters an issue with a Phase design document during implementation, they must raise an exception rather than silently pivoting the architecture in code.

### Avoiding Rework
Rework occurs when assumptions are made about missing dependencies. By enforcing strict "Approval Gates" between implementation waves, we ensure that foundational decisions (like auth schemas) are locked before dependent systems (like user profiles) are built.
