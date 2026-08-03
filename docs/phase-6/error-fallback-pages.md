# Error and Fallback Pages

Edge cases must be handled gracefully to prevent losing users when things go wrong.

## 1. 404 (Not Found)
- **Trigger:** User hits a broken link or a deleted movie slug.
- **Behavior:** A branded 404 page ("Oops! This trailer got lost in the edit."). 
- **Crucial Rule:** Always include a "Trending Trailers" grid and a search bar on the 404 page. Never leave the user at a dead end.

## 2. 500 (Server Error)
- **Trigger:** The API goes down or the database crashes.
- **Behavior:** A static, highly robust HTML page ("We're experiencing technical difficulties.") that does not rely on any backend data to render.

## 3. Missing Media Fallbacks
- **Missing Trailer:** If a YouTube video is pulled offline, the UI should not show a broken iframe. It should display a polished placeholder graphic: "Trailer currently unavailable" and still show the movie synopsis and poster.
- **Missing Poster:** The UI must implement a CSS-driven fallback poster showing the Movie Title text centered on a dark gradient background, ensuring grid layouts do not break if an image fails to load.
