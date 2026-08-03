# Monetization Research

## Objective
To identify sustainable revenue streams that fit naturally within a trailer discovery platform without severely compromising the user experience (UX) or site performance.

## Potential Monetization Models

### 1. Display Advertising (Programmatic)
- **Mechanism:** Using networks like Google AdSense, Mediavine, or Raptive to serve banner ads, sticky sidebars, or bottom adhesion units.
- **Suitability:** High. This is the industry standard for content directory sites.
- **UX Impact:** Medium-to-High. Heavy ad networks can ruin Core Web Vitals (speed) and look cluttered.
- **Recommendation:** Implement standard, non-intrusive display units (e.g., a single top banner and sidebar ad). Strictly avoid pop-ups, auto-playing outstream video ads, or full-page interstitials.

### 2. Affiliate Marketing (Ticketing & Streaming)
- **Mechanism:** Placing "Buy Tickets" (via Fandango or Atom Tickets affiliates) or "Stream Now" (via Amazon Prime Video, Apple TV affiliates) buttons on the Movie Detail pages.
- **Suitability:** Very High.
- **UX Impact:** Positive. Users actively want to know where to watch a movie after seeing a trailer. It acts as a useful feature rather than a traditional ad.
- **Recommendation:** Integrate as a primary monetization strategy for Phase 2/3.

### 3. Sponsored Placements
- **Mechanism:** Charging indie studios or distributors to feature their trailer in the "Hero" section of the homepage or as a "Trending" recommendation.
- **Suitability:** Medium. Requires manual sales effort and high baseline traffic to be attractive to advertisers.
- **UX Impact:** Low. Can be integrated seamlessly into the existing UI design (labeled clearly as "Sponsored").
- **Recommendation:** Keep architecture flexible to allow manual "pinning" of content, but do not rely on this for early revenue.

### 4. Premium Features (Subscription)
- **Mechanism:** Charging users a monthly fee for an ad-free experience, exclusive community features, or high-tier early access alerts.
- **Suitability:** Low. The value proposition of a trailer site does not currently justify a subscription, as the content (trailers) is freely available on YouTube.
- **UX Impact:** None (for free users).
- **Recommendation:** Discard for the foreseeable future.

---

## Conclusion & Strategy
For Phase 1, the platform should be built with **Display Advertising** in mind (allocating UI space for standard ad units) to ensure it can be turned on easily. However, the long-term, UX-friendly goal should rely heavily on **Affiliate Linking** (Ticketing and Streaming), as it directly aligns with the user's intent after watching a trailer.
