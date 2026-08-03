# Trending, Upcoming, and Top Rated Pages

These curated list pages serve both as major discovery vectors for users and highly valuable, internally linked hubs for search engines.

## 1. The Pages
- **`/trending` (Trending Now):** Dynamically ranked based on internal analytics (recent trailer plays/page views). Satisfies the user intent: "What is everyone watching right now?"
- **`/upcoming` (Upcoming Releases):** Filtered strictly by `release_date > NOW()`, sorted by release date ascending. Satisfies the user intent: "What's coming out next month?"
- **`/top-rated`:** Sorted by TMDB rating. Satisfies the user intent: "What are the best movies of all time?"

## 2. Page Layout Pattern
All three pages share an identical layout to the Genre Pages to ensure UI consistency and component reuse:
- A descriptive SEO-focused H1.
- A responsive grid of movie posters.
- A "Load More" button at the bottom.

## 3. SEO and Internal Linking
- Links to these three pages should exist in the global footer and optionally in the main header dropdown. 
- Consistently linking to `/upcoming` tells search engine crawlers exactly where to find the newest content on the site, ensuring new movie pages are indexed rapidly.
