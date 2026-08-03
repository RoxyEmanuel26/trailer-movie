# Performance SEO (Core Web Vitals)

Google explicitly ranks pages based on Real User Monitoring (RUM) data collected via Chrome (Core Web Vitals). 

## 1. Largest Contentful Paint (LCP)
- **Target:** < 2.5 seconds.
- **Strategy:** The LCP is usually the Hero Backdrop or the Main Movie Poster. This image must be preloaded in the `<head>` and must NOT use `loading="lazy"`. It should be served from a CDN in WebP format.

## 2. Cumulative Layout Shift (CLS)
- **Target:** < 0.1
- **Strategy:** Prevent the page from jumping around as it loads.
  - Images must have explicit `width` and `height`.
  - Ad slots must have a CSS `min-height` reserved before the ad network JavaScript executes.
  - Custom web fonts should use `font-display: swap` to prevent invisible text during load.

## 3. Interaction to Next Paint (INP)
- **Target:** < 200 milliseconds.
- **Strategy:** Keep the main thread unblocked.
  - Do not load the heavy YouTube Iframe API on initial page load (use the Video Facade pattern).
  - Defer non-critical third-party scripts (Analytics, Ad networks) until after the main content has rendered.
