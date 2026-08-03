# Cross-Cutting Concern Coordination

## Shared Rules Across the Stack

Cross-cutting concerns (Security, SEO, Logging) must be implemented systematically, not left to the whims of individual developers building individual features.

### Centralized Middleware
- **Authentication/Permissions:** Should not be checked manually inside every single API route. It must be enforced at the Edge/Middleware layer so that a developer cannot accidentally "forget" to protect a new admin route.

### Standardized Error Handling
- Do not let developers scatter `console.error` throughout the codebase.
- Implement a global `Logger` utility early in Wave 1. All caught exceptions must pass through this utility, which determines if the error should be sent to Sentry (Production) or printed nicely to the terminal (Local Development).

### Global SEO Context
- Individual React pages should only define their specific overrides (e.g., `title: 'Star Wars'`). 
- A root `layout.tsx` component must handle applying the default site name, OpenGraph images, and canonical URL bases to prevent missing metadata if a developer forgets to add it to a new page.

### Loading States & Accessibility
- The Design System (Phase 6) must provide standardized `<Skeleton />` loaders and `<Spinner />` components. Developers must be instructed to use these globally rather than writing custom CSS loaders per feature.
- All interactive components in the shared library must be built with `aria-` attributes by default, ensuring accessibility is inherited, not bolted on later.
