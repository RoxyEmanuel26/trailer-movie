# Core Web Vitals Strategy

## Target Behavior

The site will proactively monitor and optimize for Google's Core Web Vitals to ensure a baseline of high-quality user experience.

### LCP (Largest Contentful Paint) Strategy
- **Target:** < 2.5 seconds.
- **Main Influencers:** Hero movie backdrop images, primary movie posters on detail pages.
- **Approach:**
  - Preload the LCP image using `<link rel="preload">`.
  - Serve LCP images in modern formats (WebP/AVIF) and appropriate responsive sizes.
  - Avoid lazy-loading the LCP element.
  - Ensure the HTML document is delivered quickly (low TTFB).

### INP (Interaction to Next Paint) Strategy
- **Target:** < 200 milliseconds.
- **Main Influencers:** Video player initialization, search input, filtering interactions, mobile menu toggles.
- **Approach:**
  - Minimize main-thread blocking JavaScript.
  - Yield to the main thread during heavy operations.
  - Keep event handlers lightweight.
  - Provide immediate visual feedback for user interactions (e.g., active states, optimistic UI) while processing happens in the background.

### CLS (Cumulative Layout Shift) Strategy
- **Target:** < 0.1.
- **Main Influencers:** Lazy-loaded images (posters), dynamically inserted content (infinite scroll), web fonts.
- **Approach:**
  - Explicitly define `width` and `height` attributes on all images.
  - Pre-allocate space for dynamic content using CSS aspect-ratio or min-height properties.
  - Use `font-display: swap` for web fonts and provide well-matched fallback fonts to minimize shifts when fonts load.

### TTFB (Time to First Byte) Awareness
- Utilize CDN edge caching and static generation (or heavily cached SSR) for public-facing pages to ensure the HTML document is served as close to the user as possible, minimizing server response times.

### Mobile Performance Awareness
- Mobile devices often have constrained CPUs and network connections.
- Ensure smaller image variants are served to mobile devices.
- Defer non-critical JavaScript to reduce CPU load during initial render.

### Viewport-Specific Loading Priorities
- **Above the Fold:** High priority. Load immediately (HTML, critical CSS, LCP image).
- **Below the Fold:** Low priority. Lazy-load images, defer non-critical scripts, and fetch data only when it approaches the viewport.
