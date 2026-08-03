# Heading Hierarchy Strategy

A strict semantic heading hierarchy is vital for accessibility (screen readers) and SEO (helping Googlebot understand the page topic).

## 1. Single H1 Rule
- Every page must have exactly ONE `<h1>` tag.
- **Movie Page:** `<h1>Dune: Part Two</h1>`
- **Genre Page:** `<h1>Best Action Movie Trailers</h1>`
- The `<h1>` must contain the primary keyword for the page.

## 2. H2 and H3 Usage (Movie Page Example)
- `<h2>` tags are used for major content sections beneath the H1.
  - `<h2>Synopsis</h2>`
  - `<h2>Cast & Crew</h2>`
  - `<h2>More Trailers</h2>`
- `<h3>` tags are used for sub-items within those sections (e.g., if we list different versions of a trailer under "More Trailers").

## 3. Avoiding Misuse in Grids
- **Anti-Pattern:** Using `<h2>` tags for the titles of movies inside a 20-item poster grid on the homepage. This creates a messy hierarchy.
- **Solution:** Movie titles in grid cards should be styled using CSS (e.g., `class="text-xl font-bold"`) and semantic `<p>` or `<span>` tags, leaving the H1/H2 tags reserved for the actual page structure.
