# Structured Data Strategy (Schema.org)

Structured data is the primary mechanism to achieve "Rich Snippets" (like video carousels) in Google Search.

## 1. VideoObject Schema (Crucial)
- **Where:** Movie Detail Pages.
- **What:** Injected into the `<head>` as JSON-LD. It maps the YouTube iframe URL, upload date, duration, and the thumbnail image URL.
- **Why:** Without this, Google cannot index the trailer as a video. This is the single most important SEO feature of the site.

## 2. Movie Schema
- **Where:** Movie Detail Pages.
- **What:** Provides the Director, Cast (Actor schema), Release Date, and Genre.
- **Note:** This can be nested with the `VideoObject` schema (e.g., the `Movie` has a `trailer` property pointing to the `VideoObject`).

## 3. BreadcrumbList Schema
- **Where:** All pages deeper than the homepage.
- **What:** Defines the path (e.g., Home > Action > Die Hard).
- **Why:** Results in Google displaying a clean navigation path in the SERP instead of a raw URL.

## 4. ItemList (Collection) Schema
- **Where:** Genre and Collection pages.
- **What:** A list of `ListItem` objects pointing to the individual movie URLs. Helps Google understand that the page is a curated list of entities.
