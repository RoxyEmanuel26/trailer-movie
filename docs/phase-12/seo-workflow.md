# SEO Workflow

## Optimizing for Discovery

SEO management must be separated from general editorial workflows to allow specialists to work without risking content breakage.

### Meta Field Editing
- Every public-facing content type (Movie, Genre, Collection) must have dedicated `meta_title` and `meta_description` fields.
- **Default Fallbacks:** If left blank, the system automatically generates these (e.g., `Meta Title = [Movie Title] ([Year]) - Watch Trailer`). The workflow allows editors to explicitly override the fallback.

### Slug Changes
- Slugs (the URL path) are generated automatically on creation.
- If a slug is changed after publication (e.g., `/movie/dune-part-one` -> `/movie/dune`), the workflow must enforce the creation of a 301 Redirect rule. The UI should prompt: "This page is live. Create a redirect from the old URL?"

### Index / NoIndex Control
- For specific pages (e.g., a temporary promotional collection or a legal page), editors need a toggle to add a `noindex` meta tag to prevent search engines from crawling it.

### Canonical Settings
- In rare cases where duplicate content exists (e.g., a movie appearing in two different regional variants), the SEO workflow allows specifying a Custom Canonical URL to consolidate page rank.

### Search Appearance Preview
- A useful UI feature: As the editor types the meta title and description, a simulated "Google SERP Snippet" updates in real-time to show how the result will look in search engines, enforcing character limits visually.
