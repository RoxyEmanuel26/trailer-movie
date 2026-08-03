# Monetization-Safe Layout

The site must generate revenue (via ads or affiliate ticketing) without degrading the user experience or triggering Google Search penalties for intrusive interstitials.

## 1. Safe Ad Placement Zones
- **Homepage:** A horizontal banner (e.g., 728x90 or 970x250) placed exactly between the 3rd and 4th rows.
- **Movie Detail Page:** A sticky medium rectangle (300x250) in the right-hand column (on desktop), below the poster and genres. On mobile, this ad falls inline beneath the synopsis.
- **List Pages (Genres/Trending):** An inline ad card disguised as a movie poster slot (e.g., in the 4th position of the grid), clearly marked with a small "Sponsored" label.

## 2. Placements to Strictly Avoid
- **Above the Fold on Mobile:** Google penalizes sites that push content below the fold with massive top-banner ads.
- **Video Pre-rolls:** Unless we are using a premium video player with direct brand deals, we cannot run pre-roll ads on embedded YouTube videos (YouTube controls that monetization).
- **Pop-ups / Overlays:** Intrusive interstitials that block the user from seeing the trailer are strictly forbidden.

## 3. Preserving Core Web Vitals
- Ad slots must be wrapped in `<div>` containers with explicit `min-height` css properties matching the ad size. This ensures the layout doesn't violently shift downward when the ad network finally loads the iframe (preventing CLS).
