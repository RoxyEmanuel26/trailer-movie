# JavaScript Budget Strategy

## Bundle Discipline

JavaScript is the most expensive resource on the web. It blocks the main thread and impacts interactivity. We will strictly manage the JavaScript budget.

### Areas Requiring Interactivity
- Video player initialization and controls.
- Search bar auto-complete and submission.
- Filtering and sorting mechanisms.
- Mobile navigation menus.
- Carousels (if JavaScript is required over CSS-only solutions).

### Areas to Remain Static
- Footer links.
- Textual content (synopsis, cast lists).
- Basic grids of movie posters (until clicked).
- Standard page headers.

### Component-Level Hydration Discipline
- **Island Architecture / Partial Hydration:** Only send JavaScript to the client for the interactive components (the "islands"). The rest of the page remains static HTML.
- **Avoid Full-Page Hydration:** Do not use frameworks or patterns that require hydrating the entire DOM tree if only small parts of the page are interactive.

### Avoiding Unnecessary Client Bundles
- Avoid importing large utility libraries (e.g., Lodash, Moment.js) when native browser APIs (e.g., modern JavaScript array methods, Intl object) suffice.
- Ensure tree-shaking is effectively removing unused code from dependencies.

### Route-Level Bundle Splitting
- JavaScript should be split by route. A user visiting the homepage should not download the JavaScript required for the movie detail page or the user profile page.
- Load route-specific chunks only when the user navigates to that route.

### Vendor Dependency Restraint
- **Audit New Packages:** Before adding any third-party library, evaluate its bundle size impact.
- **Prefer Lightweight Alternatives:** Choose lighter alternatives for common tasks (e.g., `date-fns` over `moment`).
- **Strict Budget:** Establish a hard limit (e.g., < 150KB parsed/gzipped) for the initial JavaScript payload.
