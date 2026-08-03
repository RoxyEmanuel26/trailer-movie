# Image Performance Strategy

## Media Loading Rules

Images (posters and backdrops) represent a significant portion of the page weight. Strict rules govern their handling to ensure fast loading and visual stability.

### Poster Image Loading Rules
- **Above the Fold:** Preload the LCP poster. Do not lazy-load.
- **Below the Fold:** Enforce lazy loading natively (`loading="lazy"`).
- **Sizing:** Explicitly define width and height to prevent CLS. Use CSS `aspect-ratio` to maintain consistent shapes.

### Backdrop Image Loading Rules
- **Hero Sections:** The primary backdrop must be prioritized. If it's the LCP element, it should be preloaded.
- **Optimization:** Backdrops are large. They must be aggressively compressed, served in next-gen formats, and responsive to the viewport size to avoid downloading desktop-sized backdrops on mobile.

### Thumbnail Loading Rules
- **Video Thumbnails:** Video players should not load initially. Instead, display a highly optimized thumbnail image with a "play" icon overlay.
- **Lazy Loading:** Thumbnails in lists (e.g., related videos) must be lazy-loaded.

### Responsive Image Sizes
- Utilize `srcset` and `sizes` attributes for all images.
- Define a predefined set of breakpoints and corresponding image widths to ensure the browser selects the most appropriate size for the user's device and screen density.

### Image Format Considerations
- **Primary Formats:** Serve AVIF as the primary format, with WebP as a fallback, and JPEG/PNG as the final fallback for legacy browsers.
- **Automation:** Image format conversion and resizing should be handled automatically by an image optimization pipeline or CDN.

### Preload Priorities
- Only preload the single most critical image on the page (typically the hero backdrop or the main movie poster on a detail page). Avoid over-prefetching, which can clog the network.

### Fallback Image Behavior
- If an image fails to load or is missing from the database, a lightweight, branded fallback image or CSS gradient placeholder must be displayed. This prevents broken layouts and maintains a professional appearance.
