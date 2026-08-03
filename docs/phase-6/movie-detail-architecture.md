# Movie Detail Page Architecture

The Movie Detail Page (`/movie/[slug]`) is the most important page on the site. It must balance a premium video-watching experience with dense SEO metadata.

## Above the Fold (The Cinematic Experience)
- **Backdrop:** The background of the page is the high-res movie backdrop, darkened with a gradient overlay to ensure text legibility.
- **The Video Player:** The focal point. A large 16:9 YouTube iframe (or a video facade that loads the iframe on click to save Core Web Vitals).
- **Primary Metadata:** Title (H1), Release Year, Runtime, and Age Rating placed immediately below or beside the video player.
- **Action Buttons:** "Share", "Favorite" (future feature).

## Below the Fold (The Information Architecture)
Once the user scrolls past the video, the layout shifts to a grid prioritizing readable text:

- **Left Column (Context):**
  - **Synopsis:** A 2-3 paragraph summary of the film.
  - **Cast & Crew:** A horizontal list of circular headshots for the main actors and the director.
  
- **Right Column (Metadata & Ads):**
  - **Movie Poster:** Displayed for clear visual identification.
  - **Tags/Genres:** Clickable pill-shaped links (e.g., `[Action]`, `[Sci-Fi]`).
  - **Monetization:** A sticky ad unit (e.g., 300x250 medium rectangle) that scrolls with the user.

- **Bottom Row (Discovery):**
  - **More Trailers:** If the movie has a "Teaser" and an "Official Trailer", they are listed here as clickable thumbnails.
  - **Related Movies:** A row of 5-6 posters for similar films, keeping the user in the ecosystem.
