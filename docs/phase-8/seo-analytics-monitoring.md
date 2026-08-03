# SEO Analytics and Monitoring

You cannot improve what you cannot measure. The architecture must support robust SEO tracking.

## 1. Google Search Console (GSC) Integration
- GSC is the ultimate source of truth for SEO. The site must be verified on day one.
- **Key Metrics to Monitor:**
  - **Index Coverage:** Are our `/movie` pages actually being indexed, or are they being flagged as "Crawled - currently not indexed"?
  - **Core Web Vitals:** Tracking the field data for LCP and CLS.
  - **Video Indexing:** Ensuring Google recognizes our VideoObject schema and indexes the trailers as videos.

## 2. On-Site Analytics (Traffic)
- Use a lightweight, privacy-friendly analytics tracker (like Plausible or Fathom) or Google Analytics 4 (GA4).
- **Goal:** Track which *Types* of pages generate the most organic entrances (e.g., are we getting more traffic from Genre hubs or individual Movie pages?).

## 3. Structured Data Validation
- Implement automated testing in the CI/CD pipeline (using tools like Google's Rich Results Test API or specialized npm packages) to ensure that code changes to the frontend do not accidentally break the JSON-LD schema formatting.
