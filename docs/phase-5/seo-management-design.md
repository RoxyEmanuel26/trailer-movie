# SEO Management Design

SEO is critical for a trailer site. The admin panel must provide fine-grained control without forcing editors to understand the underlying JSON-LD or meta tags.

## 1. The SEO Tab
Every core entity (Movie, Genre, Page) has a dedicated "SEO" tab in its edit screen.

## 2. Meta Overrides
By default, the frontend generates meta titles and descriptions automatically (e.g., "Watch {Title} Official Trailer"). 
- The SEO tab provides input fields for `Custom Meta Title` and `Custom Meta Description`. 
- **Validation:** Visual character counters (e.g., 60 chars for Title, 160 chars for Description) must turn red if exceeded, warning the admin of SERP truncation.

## 3. Advanced Controls
- **URL Slug Editing:** Changing a slug is dangerous. The UI must warn the admin: "Changing this will break existing links." (Future feature: Automatically generate 301 redirects in a `redirects` table when a slug is changed).
- **Canonical URL:** A field to point to an external site or a duplicate page to avoid duplicate content penalties.
- **Index Toggles:** A simple checkbox: "Hide from Search Engines (noindex)". Useful for draft or promotional pages.

## 4. SERP Preview (Optional but highly recommended)
- As the admin types in the Custom Meta Title/Description, a small visual widget mimics how the result will look on a Google search results page.
