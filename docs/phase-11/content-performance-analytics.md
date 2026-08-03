# Content Performance Analytics

## Evaluating the Catalog

Analytics must reveal which movies and collections are driving the success of the platform.

### Top Content by Views and Engagement
- Generate rolling lists of top-performing movies based on `movie_view` and `trailer_play` events.
- Differentiate between "Most Viewed" (high traffic, maybe from a viral link) and "Most Engaging" (highest play-through rate).

### Trending Content Movement
- Calculate velocity: Which movies have seen the largest percentage increase in views over the last 24-48 hours? This data can be fed back into the product to automatically populate a "Trending Now" section.

### Newly Published vs. Evergreen
- **Newly Published:** Monitor the performance of movies added in the last 7 days. Are they getting traction on the homepage?
- **Evergreen:** Identify older movies that consistently generate steady traffic month over month (e.g., classic holiday movies).

### Underperforming Content Detection
- Identify movies that appear frequently in search results or homepage carousels but receive almost zero clicks or trailer plays. This indicates a bad poster, a broken trailer link, or content that doesn't fit the audience.

### Content Freshness
- Correlate engagement metrics with the "last updated" timestamp of a movie. Does recently updated metadata (e.g., adding a new 4K trailer) result in an engagement bump?
