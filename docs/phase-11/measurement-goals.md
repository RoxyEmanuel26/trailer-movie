# Measurement Goals

## Key Questions to Answer

The analytics architecture is designed specifically to provide clear answers to the following operational and product questions:

### Traffic & Discovery
- Which pages attract the most visits (homepage, specific categories, individual movie pages)?
- What is the bounce rate on key landing pages?
- What are the primary entry and exit points for the public site?

### Content Engagement
- Which trailers get the most engagement (measured by "play" clicks and completion rates, if tracking player events)?
- Which genres or curated collections perform best in terms of driving exploration?
- Which content drives return visits (cohort retention based on anonymous sessions)?

### Search & Navigation
- Which search terms are used most frequently?
- What percentage of searches result in zero hits (indicating a content gap or poor search algorithm)?
- Are users finding what they need via search or via browsing categories?

### Operational Health (Admin)
- Which admin actions are most frequent (e.g., creating movies, editing metadata, syncing with TMDB)?
- How often do bulk operations occur?

### System & Technical Health
- Which technical problems occur most often (e.g., 500 API errors, client-side JS crashes)?
- Which routes or API endpoints have the highest latency?
- Are background sync jobs succeeding reliably?

### SEO Visibility
- Which SEO landing pages (e.g., `/genre/action`, `/movie/dune`) perform best in organic search (correlated with Google Search Console data)?
