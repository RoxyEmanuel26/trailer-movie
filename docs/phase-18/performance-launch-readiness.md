# Performance Launch Readiness

## Validating Speed

If the site crashes under its own weight on launch day, the marketing effort is wasted.

### Core Web Vitals (CWV) Risk Review
- **LCP (Largest Contentful Paint):** Must be < 2.5s. Ensure the Homepage Hero image is preloaded (`<link rel="preload">`) and not lazy-loaded.
- **CLS (Cumulative Layout Shift):** Must be < 0.1. Ensure all movie poster `<img>` tags have explicit `width` and `height` attributes to prevent the page from jumping as images load.

### Media Loading Behavior
- **Trailer Deferral:** Verify that YouTube/Vimeo iframe embeds are lazy-loaded or use a "facade" (a static image that only loads the heavy iframe when the user clicks play). Loading 10 hidden iframes on page load will ruin mobile performance.

### Caching Behavior Readiness
- **CDN Hits:** Use the browser network tab to verify that static assets (CSS, JS, Fonts, Images) are being served with long-lived Cache-Control headers (`public, max-age=31536000, immutable`).
- **Edge Caching:** If using Next.js ISR (Incremental Static Regeneration), verify that API calls to fetch movie lists are successfully hitting the Edge cache (e.g., `x-vercel-cache: HIT`), rather than querying the database on every single page load.

### Bundle Size Awareness
- Run `npm run build` and analyze the Webpack/Turbopack output.
- **Blocker:** If the initial JavaScript payload exceeds 250kb (gzipped), the team must investigate and code-split heavy libraries before launch.
