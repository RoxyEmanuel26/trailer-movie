# Final Performance Review

## Overview
Users expect media-heavy sites to be fast. The final performance review verifies that the application meets acceptable speed thresholds and does not suffer from severe rendering issues.

## Verification Checklist

### 1. Core Web Vitals Readiness
*   [ ] **LCP (Largest Contentful Paint):** Verify LCP is < 2.5s on desktop and mobile connections for key landing pages. Ensure hero images or primary trailer placeholders are optimized.
*   [ ] **CLS (Cumulative Layout Shift):** Verify CLS is < 0.1. Ensure image dimensions are specified and UI elements do not shift as web fonts or dynamic data load.
*   [ ] **INP (Interaction to Next Paint):** Verify the site responds quickly to user input (e.g., opening a modal, triggering search).

### 2. Media Optimization
*   [ ] Verify all static images (posters, backgrounds) are served in modern formats (WebP/AVIF) and are properly compressed.
*   [ ] Verify lazy loading (`loading="lazy"`) is applied to images below the fold.
*   [ ] Verify video embeds (YouTube/Vimeo) use a facade pattern (loading a thumbnail first, swapping to iframe on interaction) to prevent heavy initial page loads.

### 3. Cache Behavior
*   [ ] Verify static assets (CSS, JS, fonts) are served with long-lived `Cache-Control` headers.
*   [ ] Verify API responses that change infrequently (e.g., a list of genres) are cached appropriately at the edge or via SWR (Stale-While-Revalidate).

### 4. Admin Performance
*   [ ] Verify that loading the admin dashboard with the maximum expected dataset (e.g., 10,000 movies) does not crash the browser or cause severe lag. Ensure pagination is working on data tables.

### 5. Mobile Performance
*   [ ] Run Lighthouse audits specifically using the mobile profile (throttled network and CPU). Verify the experience remains acceptable on mid-tier devices.
