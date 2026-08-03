# SEO & Performance Design Rules

## Fast Rendering & Image Optimization
- **Rule:** The design must not rely on heavy, blocking JavaScript to render the initial above-the-fold content. 
- **Image Formats:** The design assumes all raster images (posters, backdrops) will be delivered in modern formats (WebP/AVIF).
- **Responsive Images:** The design requires that `srcset` is utilized. Mobile devices should not download desktop-sized backdrops.
- **Eager vs. Lazy Loading:** The Hero image/poster (LCP element) MUST be loaded eagerly. Every image below the fold MUST be lazy-loaded.

## Minimal Cumulative Layout Shift (CLS)
- **Rule:** The UI must never shift unexpectedly as assets load.
- **Implementation:** Every image component (Poster, Video Facade) must have a predefined `aspect-ratio` or explicit `width` and `height` attributes in the HTML/CSS so the browser can reserve the space before the image downloads.

## Clear Heading Structure
- **Rule:** The visual design must map directly to semantic HTML heading hierarchy.
- **H1:** There is exactly ONE `<h1>` per page (e.g., The Movie Title on a detail page, or "Trending Trailers" on the homepage). It must be the most visually prominent text.
- **H2-H6:** Subsections must strictly follow sequential order. Do not use an `<h3>` just because you want a smaller font; use CSS classes to alter text size while maintaining correct semantic tags.

## Mobile-First Layouts
- **Rule:** The design must prioritize the mobile viewport. Google primarily crawls the mobile version of the site. If content is hidden on mobile (e.g., tucked away in a complex accordion), Google may devalue it. All critical SEO text (synopsis, cast) must be visible on mobile without requiring interaction if possible.
