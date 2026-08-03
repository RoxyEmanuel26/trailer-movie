# Robots and Crawl Control

We must direct Googlebot efficiently, ensuring it spends its "Crawl Budget" on valuable pages, not administrative noise.

## 1. `robots.txt` Rules
The global `robots.txt` file sits at the root of the domain.
- **Allow:** All standard traffic.
- **Disallow:** `/admin/`, `/api/`, `/search`
- **Sitemap Declaration:** Must include `Sitemap: https://domain.com/sitemap.xml` at the bottom of the file.

## 2. Meta Robots Directive (`<meta name="robots">`)
- Used on a per-page basis when `robots.txt` is too broad.
- **Search Results (`/search?q=...`):** Must include `<meta name="robots" content="noindex, follow">`. We want Google to *follow* the links to the movie pages it finds there, but we do *not* want the search page itself indexed.
- **Empty / Thin Pages:** As defined in Content Depth, pages lacking minimum content thresholds will dynamically inject `noindex`.

## 3. Crawl Waste Prevention
- We will not use infinite scrolling arrays that append page URLs to the DOM in a way that causes Googlebot to click endlessly. Pagination links will use standard `href` attributes, but we will rely on our Hub Pages (`/trending`) to ensure discoverability rather than expecting Googlebot to click to Page 400 of a genre list.
