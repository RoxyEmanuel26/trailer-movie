# Phase 4 Decision Log

This document records the major architectural decisions and trade-offs made during the API design phase.

## DECISION 001: Backend For Frontend (BFF) Pattern vs Separate API
- **Decision:** The API layer is designed conceptually as a unified service. However, if deployed using a meta-framework like Next.js, it will act as a Backend-For-Frontend, meaning the API routes live in the same repository as the public UI.
- **Reasoning:** Reduces deployment complexity, allows sharing TypeScript interfaces between the frontend and backend, and simplifies SSR data fetching.
- **Trade-off:** Tightly couples the API to the web frontend. If we build a native iOS app later, it must consume these same Next.js API routes or we must extract the API into a standalone microservice.

## DECISION 002: Hiding External APIs from the Client
- **Decision:** The frontend browser will *never* make HTTP requests directly to TMDB or YouTube APIs. All data flows through our internal API layer.
- **Reasoning:** Prevents exposing API keys in the client bundle. Allows us to cache responses, sanitize data, and swap providers in the future without forcing users to update their clients.
- **Trade-off:** Increases bandwidth and compute load on our own servers, as we must proxy and process the data.

## DECISION 003: Graceful Degradation over Hard Failures
- **Decision:** If a movie lacks a trailer or a poster, the API will return `null` for those fields rather than throwing an error. If TMDB is down during a sync, the local database remains the source of truth.
- **Reasoning:** A missing poster is better than a crashed website. The UI can handle empty states gracefully.
- **Trade-off:** Increases the amount of conditional rendering logic (`if (movie.poster_url)`) required in the frontend UI.

## DECISION 004: Generating Schema.org JSON-LD on the Server
- **Decision:** The API `seo` object will contain pre-formatted structured data strings, rather than making the frontend assemble them.
- **Reasoning:** Ensures the structured data perfectly matches the database state. Simplifies the frontend components (they just inject a string).
- **Trade-off:** Slightly increases the API payload size.
