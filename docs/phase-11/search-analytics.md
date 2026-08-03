# Search Analytics

## Measuring Discovery

Search is often the primary way users find specific content. Monitoring its effectiveness is critical.

### Search Term Frequency
- Aggregate the most frequently searched terms. This informs what content should be featured on the homepage or what movies the site might be missing.

### Zero-Result Searches
- Track searches that return `result_count: 0`.
- High volumes of zero-result searches for specific terms indicate a content gap (e.g., users searching for "Deadpool 3" before it's in the database) or a failure in the search index's synonym handling.

### Search-to-Click Conversion
- Measure the percentage of `search_query` events that are followed by a `movie_view` event within the same session.
- A low conversion rate means the search results are irrelevant to the user's intent.

### Search Refinement Patterns
- Track if a user searches for "Bat", gets poor results, and immediately searches for "Batman". This helps identify needed improvements in auto-complete or partial matching.

### High-Value Search Topics
- Correlate search terms with `trailer_play` events. Which search terms actually lead to the highest engagement, not just the most clicks?

### Search Latency Tracking
- While primarily a system metric, track the response time of the search API. If search takes > 1 second, abandonment rates will spike.
