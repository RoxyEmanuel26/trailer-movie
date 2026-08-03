# Decision Log Strategy

## Recording the "Why"

Architecture Decision Records (ADRs) capture major architectural choices. This prevents teams from endlessly debating a topic that was already settled six months ago.

### What Must Be Logged
Log any decision that:
- Changes the primary tech stack (e.g., "Switching from React to SolidJS").
- Introduces a new third-party dependency with a cost attached (e.g., "Selecting Algolia for Search").
- Implements a hard constraint on future development (e.g., "All dates must be stored as UTC integers, never strings").

### Decision Log Format
Each entry in `/docs/logs/decision-log.md` (or individual ADR files) must contain:

1. **Title:** A short, declarative sentence (e.g., "Use PostgreSQL for Core Data").
2. **Date:** When the decision was finalized.
3. **Context:** What was the problem we were trying to solve? (e.g., "We needed relational integrity and complex querying for the movie taxonomy.")
4. **Alternatives Considered:** What else did we look at, and why did we reject it? (e.g., "MongoDB: Rejected because handling many-to-many relationships for genres/cast was too cumbersome.")
5. **Decision:** What we actually chose.
6. **Consequences:** The trade-offs we accepted (e.g., "Requires maintaining a rigid schema and running migration scripts").

### Relationship to Implementation
Decision logs are immutable once enacted. If a decision is later reversed (e.g., moving away from PostgreSQL), a *new* decision log entry is created referencing the old one, rather than rewriting history.
