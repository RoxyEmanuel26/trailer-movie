# SEO Research & Strategy

## Core SEO Objective
To rank highly for "long-tail" and intent-driven search queries related to specific movie trailers (e.g., "Dune Part Two official trailer 2024", "upcoming horror movies trailers"). 

## URL Structure Strategy
URLs must be clean, readable, and keyword-rich.
- **Homepage:** `/`
- **Movie Detail:** `/movie/{slug}-{year}` (e.g., `/movie/oppenheimer-2023`). Including the year helps resolve name collisions (remakes) and targets year-based searches.
- **Genre Landing Page:** `/genre/{slug}` (e.g., `/genre/sci-fi`).
- **Sitemap:** `/sitemap.xml`

## Indexable Page Types
- **Movie Detail Pages:** The primary driver of long-tail organic traffic.
- **Genre Pages:** Crucial for category-level searches ("new action trailers").
- **Homepage:** Branded search and generic terms.

*(Search result pages and admin pages will be explicitly blocked from indexing via `robots.txt` and `noindex` tags to prevent crawler waste and thin-content penalties).*

## Internal Linking Strategy
- **Breadcrumbs:** Implement on Movie Detail pages (e.g., `Home > Action > Mad Max: Fury Road`).
- **Contextual Linking:** "More like this" sections on movie pages will link to similar titles, keeping search engine bots crawling deep into the site.
- **Footer Links:** Top 10 most popular genres accessible from every page.

## Title & Meta Description Strategy
- **Movie Title Tag:** `[Movie Title] ([Year]) Official Trailer - [Site Name]`
- **Movie Meta Description:** Dynamic generation combining synopsis and release status. "Watch the official trailer for [Movie Title]. In theaters [Release Date]. [Truncated Synopsis]..."
- **Genre Title Tag:** `Best Upcoming [Genre Name] Movie Trailers | [Site Name]`

## Schema Markup Opportunities
Structured data is mandatory for this project to secure rich results in Google.
- **`Movie` Schema:** Applied to the movie detail page (includes director, actors, release date, image).
- **`VideoObject` Schema:** Applied to the embedded trailer (includes thumbnail URL, upload date, duration, description). This is critical for appearing in the "Videos" tab of Google Search.
- **`BreadcrumbList` Schema:** For hierarchical navigation clarity.

## Canonical Handling Concerns
- Ensure every Movie Detail page has a self-referencing canonical URL (`<link rel="canonical" href="..." />`) to prevent duplicate content issues if tracking parameters (like UTM tags) are appended to URLs from social media.
