# Perceived Performance Strategy

## Feeling Fast

Perceived performance is often more important than objective load times. The application must actively communicate progress and responsiveness to the user, making wait times feel shorter.

### Skeleton Screens
- Use skeleton screens (placeholder shapes that mimic the layout of the incoming content) instead of traditional spinning loaders for main content areas (like movie grids or detail pages).
- Skeletons provide context and reassure the user that the layout is stable and content is imminent.

### Progressive Disclosure
- Render the most critical information first (e.g., Movie Title, Rating, Poster) and progressively load secondary information (e.g., Full Cast List, Similar Movies, Reviews) lower down the page.
- Do not wait for *all* data to resolve before showing *any* data.

### Placeholder Cards
- While images are lazy-loading, display a solid background color (perhaps extracted from the dominant color of the image itself, if available via metadata) or a subtle gradient. This prevents the "broken image" look and maintains layout structure.

### Immediate Feedback on Clicks
- Every interactive element must provide immediate visual feedback upon interaction (e.g., a button changing color on `:active` or click).
- Do not leave the user wondering if their click registered while waiting for a network request to complete.

### Optimistic UI
- Use optimistic UI updates where safe and appropriate. For example, if a user clicks a "Like" or "Add to Watchlist" button, instantly update the UI to reflect the new state, and send the API request in the background.
- Only use this for actions with a very high probability of success. Provide a graceful rollback and error message if the background request fails.

### Graceful Loading Transitions
- When transitioning from a skeleton state to the final loaded state, use a quick, subtle crossfade rather than a harsh, sudden snap. This makes the appearance of content feel deliberate and polished.
