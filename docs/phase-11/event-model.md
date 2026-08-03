# Analytics Event Model

## Event Taxonomy

The system captures specific, structured events to measure user behavior and system operations.

### Public Interaction Events
- `page_view`: Fired when a user loads a distinct route (e.g., Homepage, Category).
  - *Purpose:* Understand traffic volume and routing popularity.
- `movie_view`: Fired when a user visits a specific movie detail page.
  - *Purpose:* Track interest in specific titles.
- `trailer_play`: Fired when the user clicks the play button on a trailer facade.
  - *Purpose:* Measure actual engagement vs. just viewing the poster.
- `search_query`: Fired when a user submits a search.
  - *Purpose:* Understand what users are looking for.
- `filter_apply`: Fired when a user applies a genre, year, or sort filter.
  - *Purpose:* Understand how users narrow down content.
- `collection_click`: Fired when a user clicks into a curated collection from the homepage.
  - *Purpose:* Measure the effectiveness of editorial curation.

### Admin Action Events
- `admin_login`: Fired upon successful admin authentication.
  - *Purpose:* Security auditing and usage tracking.
- `movie_create` / `movie_update` / `movie_delete`: Fired upon data mutation.
  - *Purpose:* Track content velocity and audit changes.
- `sync_trigger`: Fired when an admin manually triggers an external data sync.
  - *Purpose:* Monitor operational burden.

### System & Performance Events
- `api_error`: Fired by the backend when returning a 5xx status.
  - *Purpose:* Alerting on system degradation.
- `sync_job_complete`: Fired when a background job finishes.
  - *Purpose:* Monitor automated data freshness.
- `client_performance_metric`: Fired by the client to report Core Web Vitals (LCP, INP, CLS).
  - *Purpose:* Real-world performance monitoring.
