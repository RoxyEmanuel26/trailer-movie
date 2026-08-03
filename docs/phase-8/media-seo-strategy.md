# Media SEO Strategy

Images and Videos are the core product of this platform. They must be optimized for Google Image Search and Google Video Search.

## 1. Image File Naming
- Before an image is uploaded (or synced from TMDB), the backend must rename the file to be semantically descriptive.
- **Bad:** `IMG_9482.jpg` or `xj984jdf.webp`
- **Good:** `dune-part-two-movie-poster-2024.webp`

## 2. Alt Text
- Alt text is mandatory for accessibility and image SEO.
- **Posters:** `alt="Official Poster for {Movie Title} ({Year})"`
- **Backdrops:** `alt="Scene from the movie {Movie Title}"`
- **Cast Headshots:** `alt="Actor {Actor Name}"`

## 3. Video Thumbnail Strategy
- The YouTube facade uses the highest-resolution thumbnail available (`maxresdefault.jpg`).
- We must pass this thumbnail URL into the `VideoObject` Schema JSON-LD. Google uses this exact image to represent the video in the SERP carousel.

## 4. Format and Dimensions
- Serve all images in Next-Gen formats (WebP).
- Define explicit `width` and `height` attributes on `<img>` tags to prevent Cumulative Layout Shift (CLS), which directly harms SEO rankings.
