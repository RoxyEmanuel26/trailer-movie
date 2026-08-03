# Movie UI Patterns

## Aspect Ratios
Consistent imagery is critical to a cinematic feel.
- **Movie Posters:** Must rigidly adhere to a `2:3` aspect ratio. (e.g., 400x600px). If a source image does not match, it must be cropped (using `object-fit: cover`) to fit this bounding box to prevent broken grids.
- **Trailer Thumbnails / Backdrops:** Must adhere to a `16:9` aspect ratio.

## Empty Poster Fallback
- **Rule:** If a movie lacks a poster, do not show a broken image icon.
- **Treatment:** Display a Surface Level 1 (`#181818`) placeholder with the movie title centered in Text Secondary (`#AAAAAA`) using a standardized fallback icon (e.g., a film clapperboard).

## Cast List Treatment
- **Display:** Horizontal scrolling list of circular avatars (1:1 aspect ratio, `object-fit: cover`).
- **Text:** Actor name (Primary Text) stacked above Character name (Muted Text, smaller font).
- **Fallback:** Initials in a colored circle if no photo is available.

## Metadata Display
- **Rating (e.g., PG-13, R):** Displayed inside a subtle border box (Surface Level 3) with small, uppercase text.
- **Release Date & Runtime:** Displayed inline, separated by bullet characters (`•`).
- **Genres:** Displayed as a comma-separated text list or small inline chips immediately below the title.

## Trailer Embed Facade
- **Rule:** Never load a raw YouTube iframe on page load.
- **Treatment:** Display the 16:9 high-resolution YouTube thumbnail. Overlay a large, visually striking Play button (Primary Red). Upon user click, swap the DOM element for the iframe with `autoplay=1`.
