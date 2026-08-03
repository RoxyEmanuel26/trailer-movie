# Layout Stability Strategy

## Preventing CLS

Visual stability is a core quality metric. Users should never lose their place or accidentally click the wrong element because the layout shifted.

### Space Reservation for Media
- **Images:** All `<img>` tags must include explicit `width` and `height` attributes (or use CSS `aspect-ratio`). This allows the browser to calculate the space required before the image downloads.
- **Videos/Embeds:** Reserve the exact container size for the video player facade/thumbnail. When the actual player loads, it must occupy the exact same dimensions.

### Skeleton and Placeholder Behavior
- **Skeletons:** While dynamic content is fetching client-side, display skeleton UI components that perfectly match the dimensions of the final loaded content.
- **Placeholders:** For images, use a solid color or a very low-resolution blurred version as a placeholder to hold the layout structure.

### Font Loading Stability
- Use `font-display: swap` to ensure text is visible immediately using a fallback font while the custom web font loads.
- Critically, select fallback fonts (system fonts) that closely match the x-height and width metrics of the custom font to minimize the layout shift when the fonts swap. Use CSS font metric overrides (like `size-adjust`) if necessary.

### Ad Slot Reservation (If Applicable)
- If ad slots are introduced, their dimensions must be fixed and space reserved in the layout from the initial render. Ad containers must not collapse if an ad fails to fill, nor should they expand dynamically.

### Dynamic Content Insertion Rules
- **Avoid Top Insertion:** Do not insert new dynamic content above existing content that the user is currently viewing (e.g., auto-updating a feed while the user is reading it).
- **User Action Required:** If new content is available, show a prominent "Load New Items" button rather than shifting the layout unexpectedly.

### Error and Fallback Layout Behavior
- Error states (e.g., "Failed to load movies") must occupy the same layout space as the successful state to prevent the footer or surrounding content from jumping up.
