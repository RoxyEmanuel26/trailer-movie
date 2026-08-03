# SEO Integration Strategy

The API must supply exactly what the frontend needs to render perfect SSR/Static meta tags and structured data.

## 1. Metadata Payload Support
Every public detail endpoint (e.g., `/api/v1/movies/:slug`) must include a dedicated `seo` object in its response.
- The `SeoService` intercepts the request. It first checks the `seo_pages` database table for manual overrides. 
- If none exist, it generates fallback defaults using the movie's title and synopsis.

**Example Payload:**
```json
"seo": {
  "title": "Dune: Part Two (2024) Official Trailer - Watch Now",
  "description": "Watch the official trailer for Dune: Part Two. Paul Atreides unites with Chani...",
  "canonical": "https://domain.com/movie/dune-part-two",
  "og_image": "https://s3.../dune-backdrop.webp",
  "noindex": false
}
```

## 2. Structured Data (Schema.org) Support
- The API response for a movie must include a pre-formatted JSON object representing the `VideoObject` and `Movie` schema. 
- The frontend framework will simply stringify this object and inject it into a `<script type="application/ld+json">` tag in the document `<head>`.
- **Why API-side?** Generating the complex Schema schema on the server ensures it matches the database state exactly and removes heavy transformation logic from the client.

## 3. Sitemap Generation
- The API will expose a dedicated internal endpoint (e.g., `/api/system/seo/sitemap-data`) that returns a flat array of all active movie URLs, genre URLs, and their `updated_at` timestamps.
- The frontend framework (like Next.js) will consume this to build the physical `sitemap.xml` file.
