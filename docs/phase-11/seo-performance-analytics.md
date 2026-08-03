# SEO Performance Analytics

## Measuring Organic Visibility

While internal analytics track what users do *on* the site, SEO analytics track how they *arrive*.

### Organic Landing Pages
- Identify which pages (specific movies, actors, or genres) are the most frequent entry points for traffic where `referrer` matches search engines (Google, Bing).

### CTR-Oriented Performance Concepts
- While actual Click-Through Rate (CTR) comes from Google Search Console, internal analytics can infer SEO success by tracking the volume of organic sessions landing on newly created programmatic pages (e.g., `/year/2023/genre/sci-fi`).

### Indexation Health Proxies
- A sudden drop in organic entry traffic to a specific category of pages (e.g., all older movies) might indicate an indexation issue, a bad robots.txt deployment, or a canonical URL error.

### Page Performance as SEO Signal
- Correlate Core Web Vitals (`client_performance_metric`) with organic traffic trends. Since Google uses page speed as a ranking factor, identifying routes with poor LCP/CLS is an SEO priority, not just a UX priority.

### Structured Data Validation Signals
- While not tracked via user events, the monitoring architecture should include automated synthetic tests (e.g., Lighthouse CI) to ensure Schema.org structured data (Movie, VideoObject) is present and valid on critical pages, as this directly affects rich snippet appearance in search.
