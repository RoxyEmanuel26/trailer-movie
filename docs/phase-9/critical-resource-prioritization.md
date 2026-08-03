# Critical Resource Prioritization

## Loading Sequence

To ensure the fastest possible initial paint, resources must be strictly prioritized. The browser should focus entirely on what the user sees first.

### Above-the-Fold Priorities
- The HTML document itself must be delivered rapidly (low TTFB).
- Any CSS required to render the initial viewport (Critical CSS) should be prioritized, ideally inlined or preloaded.
- JavaScript required for above-the-fold interactivity (if any) is prioritized over below-the-fold scripts.

### Hero Image Priority
- The hero image (backdrop or main poster) is almost always the LCP (Largest Contentful Paint) element.
- It must be explicitly preloaded in the `<head>`.
- It must not be lazy-loaded.

### Title and Metadata Priority
- Text content (titles, synopsis) is lightweight and critical. It should be delivered as part of the initial HTML payload (SSR/SSG).
- Do not require client-side JavaScript fetching to display the primary title of the page.

### Navigation Priority
- The primary navigation bar (header) must render immediately. It provides context and a means to escape if the user landed on the wrong page.
- Do not lazy-load the core navigation structure, though sub-menus can be deferred.

### Critical CSS or Style Priorities
- If using a CSS-in-JS or separate CSS files, ensure the styles required for the first paint are delivered blocking the render.
- Defer non-critical CSS (e.g., styles for footer, modals, below-the-fold components) using `media="print"` and swapping to `media="all"` on load, or via lazy-loaded components.

### Deferred Non-Critical Content
- **Analytics/Tracking:** Scripts for Google Analytics, Tag Manager, etc., must be deferred or loaded asynchronously with low priority. They must never block the main thread during initial load.
- **Third-Party Widgets:** Chat widgets, social embeds, or feedback forms must be heavily deferred until the page is fully loaded and idle.
- **Below-the-fold Images:** Enforce native lazy loading.
