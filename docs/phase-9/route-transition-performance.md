# Route Transition Performance

## Smooth Navigation

Navigating between pages on the site (e.g., from the homepage to a movie detail page) should feel like a fluid application experience, not a series of distinct page reloads.

### Prefetch Strategy for Likely Next Pages
- Use link prefetching for highly probable next actions.
- **Desktop:** Prefetch on hover of a movie poster or navigation link.
- **Mobile:** Prefetch on link intersection with the viewport (with restraint to save data).
- Prefetch the HTML (or JSON data if using a SPA router) so the next page renders instantly upon click.

### Transition Smoothness
- Avoid heavy, complex animations between routes that might cause jank or delay the perceived load of the next page.
- Simple crossfades or slide transitions are acceptable if they perform consistently at 60fps.

### Avoiding Full-Page Flashes
- Utilize a client-side router (if building a SPA/hybrid app) to update the DOM without triggering a full browser refresh. This prevents the "white flash" associated with traditional multi-page applications.

### Loading State Behavior
- If the next page's data is not prefetched and takes time to load, the transition must be handled gracefully.
- Show a prominent, lightweight loading indicator at the top of the page (like a progress bar) immediately upon click, rather than leaving the user on the current page with no feedback.

### Suspense or Skeleton Usage
- When navigating to a new route, render the layout shell immediately.
- Use Suspense boundaries (or equivalent concepts) to show skeleton loaders for the specific content areas (e.g., the movie poster, the trailer frame) while their specific data resolves.

### Back Navigation Behavior
- **bfcache (Back/Forward Cache):** Ensure the site is compatible with the browser's bfcache. This means avoiding `unload` event listeners and certain `Cache-Control` headers (like `no-store`) on public pages where possible, allowing instant back/forward navigation.
- If data must be re-fetched on back navigation, use stale-while-revalidate to show the previous state immediately.
