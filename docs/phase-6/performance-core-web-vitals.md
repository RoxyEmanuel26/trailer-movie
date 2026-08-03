# Performance and Core Web Vitals

A slow trailer site will be heavily penalized by Google and abandoned by users.

## 1. Largest Contentful Paint (LCP)
- The LCP element is almost always the Movie Poster or the Hero Video Thumbnail.
- **Rule:** The LCP image must be preloaded in the `<head>` using `<link rel="preload">`. It must NOT be lazy-loaded.

## 2. Video Loading Behavior (Crucial)
- Embedding a raw YouTube iframe downloads ~500kb of JavaScript immediately, destroying page load speed.
- **Rule:** We use a "Video Facade" pattern (like the `lite-youtube-embed` library). The initial page load only fetches the static YouTube thumbnail image. The heavy iframe player is only injected into the DOM when the user clicks the "Play" button.

## 3. Image Optimization
- All images must be served in modern formats (WebP or AVIF).
- All poster cards below the fold must use `loading="lazy"`.
- All images must include explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS).

## 4. Skeleton Loading
- When navigating between pages via a client-side router, display a skeleton wireframe of the layout rather than a generic spinning wheel. This makes the application feel significantly faster.
