# Public Traffic Analytics

## Measuring Audience Footprint

Public traffic analytics provide a macro view of the website's health and reach.

### Page-Level Visits
- Track raw `page_view` counts for every route to determine the most popular sections of the site.

### Unique and Returning Visitors
- Use privacy-respecting, rolling session IDs (e.g., a cookie that expires after 30 minutes of inactivity) to calculate distinct "Sessions".
- Define a "Returning Visitor" based on a slightly longer-lived anonymous cookie (e.g., 30 days) to gauge if the site is building a loyal audience.

### Entry and Exit Pages
- **Entry Pages:** Identify which pages users land on most frequently from external sources (search engines, social media). This helps validate SEO efforts.
- **Exit Pages:** Identify where users most commonly abandon the site. High exit rates on search result pages might indicate poor search quality.

### Session Depth and Paths
- **Session Depth:** Measure the average number of pages viewed per session. A higher depth indicates good internal linking and engaging content.
- **Navigation Paths:** Aggregate common flows (e.g., Homepage -> Search -> Movie Detail -> Play Trailer) to understand the typical user journey.

### Device and Viewport Breakdowns
- Segment traffic by `device_type` (Mobile vs. Desktop) to ensure the development focus matches the audience's hardware.
- If necessary for design decisions, track broad viewport brackets (e.g., narrow, medium, wide).
