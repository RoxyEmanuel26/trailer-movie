# Phase 17 Decision Log

## Orchestration & Execution Decisions

This document records the major strategic decisions regarding how the implementation phase will be executed.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Admin UI Built Before Public UI** | The Admin UI (CMS) is required to easily populate the database with realistic test data (movies, posters) which makes building the Public UI much faster and more accurate. | Delays the visual "wow" factor for stakeholders who want to see the public homepage first. |
| **Strict Wave Approval Gates** | A new implementation wave cannot begin until the previous wave is fully verified and merged to Staging. | Prevents parallelizing work across entirely different domains, potentially slowing down a massive team, but drastically reduces integration bugs. |
| **Feature Flags for High-Risk UI** | Complex UI features must be merged behind a feature flag so they can deploy to production continuously without exposing broken states to users. | Adds technical debt (flag cleanup) and complicates testing (need to test flag ON and flag OFF states). |
| **Database Migrations are Multi-Step** | Renaming or dropping columns requires a multi-PR process to ensure the application can always be rolled back without crashing. | Increases the overhead and time required to make seemingly "simple" database changes. |
| **No Uncontrolled Refactoring** | Implementing agents (human or AI) are banned from "drive-by" refactoring of out-of-scope files during the initial waves to prevent scope creep. | Minor technical debt or ugly code might survive slightly longer before being cleaned up in a dedicated tech-debt sprint. |
