# URL Architecture

URLs must be clean, semantic, and permanent.

## 1. Slug Rules
- Slugs are generated from the primary title using strict rules: lowercase, alphanumeric, hyphens replacing spaces (e.g., "Spider-Man: No Way Home" -> `spider-man-no-way-home`).
- Slugs do NOT include database IDs (e.g., `/movie/123-dune`). This keeps URLs pristine. The database enforces slug uniqueness.

## 2. Route Consistency
- **Flat Structure:** We use `/movie/[slug]` rather than nesting movies under genres (e.g., `/genre/sci-fi/dune`). Movies often have multiple genres; nesting creates duplicate URLs or complex canonicalization issues.

## 3. Handling Changed Slugs
- If an admin edits a movie title, the slug *can* change, but this is highly destructive to SEO.
- **Strategy:** If a slug changes, the system must automatically write a record to a `redirects` table mapping the `old_slug` to the `new_slug` with a `301 Permanent Redirect`.

## 4. URL Parameters
- Sorting/Filtering (e.g., `/genre/action?sort=newest`) must use standard query parameters.
- These parameterized URLs must include a Canonical Tag pointing back to the clean URL (`/genre/action`) to prevent duplicate content indexing.
