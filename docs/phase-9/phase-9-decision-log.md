# Phase 9 Decision Log

## Performance Architecture Decisions

This document records the major structural and strategic decisions made during Phase 9 to ensure application performance and stability.

| Decision | Rationale | Trade-offs |
| :--- | :--- | :--- |
| **Thumbnail-First Video Players** | Loading embedded video players on initial page load significantly damages LCP, TBT, and overall TTFB. Using a static image facade defers this cost until the user actively decides to watch the trailer. | Requires an extra click to start playback; users might expect immediate autoplay. Overridden by the massive performance gain. |
| **Hybrid Rendering (SSG + SSR + CSR)** | No single rendering strategy fits all needs. SSG provides the fastest TTFB for public catalog pages. CSR is necessary for the complex state of the admin panel. | Increases architectural complexity; requires a framework (like Next.js or Nuxt) that seamlessly supports multiple rendering modes per route. |
| **Strict Image Dimension Enforcement** | Explicitly defining `width` and `height` or using CSS `aspect-ratio` on all media prevents Cumulative Layout Shift (CLS). | Requires backend or CMS systems to always provide image metadata (dimensions) alongside the image URL. |
| **Progressive/Partial Hydration** | Hydrating the entire DOM tree for a page where only a few components (like a search bar or video player) are interactive is a waste of CPU cycles on the client. | May require specific framework capabilities (e.g., React Server Components, Astro islands) to implement efficiently, potentially limiting technology choices. |
| **SWR (Stale-While-Revalidate) for Client Fetching** | Providing immediate visual feedback with slightly stale data is vastly preferable to showing a loading spinner on every navigation or interaction. | Potential for a brief visual "flicker" if the newly fetched data differs significantly from the cached data. |
| **CI/CD Performance Budgets** | Without automated checks, performance naturally degrades over time as features are added. Failing builds on budget breaches forces performance to remain a priority. | Can slow down development velocity if developers frequently hit budget limits and have to refactor or seek exceptions. |
| **Debounced Search Inputs** | Firing a backend query on every single keystroke of a search input overwhelms the server and creates race conditions on the client. | Introduces a slight (e.g., 300ms) intentional delay before search results appear, which must be masked with instant loading indicators. |
