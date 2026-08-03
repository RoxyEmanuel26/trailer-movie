# Content Depth Strategy

Google penalizes "Thin Content" (pages with very little text, or pages that just embed a YouTube video with no context).

## 1. The Movie Page Standard
A Movie Detail page cannot exist with just a title and a video. It must meet a minimum data threshold to be set to `indexable`:
- A textual synopsis (minimum 50 words).
- Release date.
- At least 3 Cast/Crew members.
- If these are missing, the page is dynamically rendered with `<meta name="robots" content="noindex">` until a CMS Admin or the TMDB Sync populates the data.

## 2. Enriching Category Pages
- A Genre page displaying a grid of posters has very little actual text for Google to read.
- **Solution:** Every Genre and Collection page must have a dedicated rich-text "SEO Description" field at the top of the page (below the H1). This provides 1-2 paragraphs of contextual, keyword-rich text (e.g., "Explore the best Sci-Fi trailers of 2024, featuring space exploration...").

## 3. Unique vs Templated Text
- The synopsis must be unique (or at least high quality from TMDB). 
- Avoid auto-generating generic paragraphs like *"Welcome to the page for [Movie]. [Movie] is a great film. Watch the [Movie] trailer here."* Google's Helpful Content Update heavily penalizes this kind of low-effort templated text.
