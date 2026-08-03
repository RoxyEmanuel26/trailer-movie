# Engagement Analytics

## Measuring Interaction

Traffic means nothing if users don't engage. This layer measures the depth of interaction with the content.

### Trailer Clicks (The North Star)
- The primary engagement metric for this product is the `trailer_play` event.
- Calculate the "View-to-Play Conversion Rate" (Trailer Plays / Movie Detail Page Views) to determine how compelling a movie's presentation is.

### Poster and Related Content Clicks
- Measure clicks on movie posters from the homepage grids or the "Related Movies" sections.
- This indicates the effectiveness of the recommendation algorithm or the visual appeal of the poster art.

### Genre and Filter Usage
- Track which genres are clicked most often from the navigation or movie detail pages.
- Track usage of specific filters (e.g., "Sort by Release Date," "Filter by Year"). High usage indicates users want more control over content discovery.

### Search Result Interactions
- When a user searches, do they click on the 1st result, the 10th result, or give up entirely?
- Tracking clicks on specific positions in the search results helps tune the search relevance algorithm.

### Time-on-Page (Proxies)
- Precise time-on-page is notoriously difficult to track accurately without heavy client-side polling.
- Instead, use proxies: Did they fire a `trailer_play` event? Did they trigger a `scroll_depth` event (e.g., scrolled past 50% of the page to read the cast list)?
