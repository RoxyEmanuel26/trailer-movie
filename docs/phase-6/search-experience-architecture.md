# Search Experience Architecture

Search is the fallback when users know exactly what they want. It must be omnipresent and forgiving.

## 1. Input Placement
- A persistent search icon/bar in the global site header.
- On mobile, tapping the search icon expands a full-screen search overlay.

## 2. Autocomplete (Search Hinting)
- As the user types (e.g., "Incep"), a dropdown overlay appears with the top 5 matching movie titles and posters.
- Clicking a suggestion bypasses the search results page and routes directly to `/movie/[slug]`.

## 3. Search Results Page (`/search?q=query`)
- **Structure:** An H1 ("Search results for 'query'") followed by the standard movie poster grid.
- **Sorting:** Default sorted by relevance, with a fallback to popularity.

## 4. Empty State Behavior
- If a user searches for a typo or non-existent movie, never show a blank page.
- **UI Element:** "We couldn't find any trailers matching '[query]'."
- **Fallback Content:** Immediately below the message, display a "Trending Now" grid to pull the user back into the content ecosystem and prevent them from bouncing.
