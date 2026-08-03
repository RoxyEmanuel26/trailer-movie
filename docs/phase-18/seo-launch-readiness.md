# SEO Launch Readiness

## Opening the Gates for Google

A misconfigured launch can destroy a site's search rankings on day one. SEO readiness is a strict blocker.

### Indexability Verification
- **The Staging Tag:** During development, the Staging site utilizes `<meta name="robots" content="noindex, nofollow">` to prevent Google from indexing unfinished work. 
- **Blocker:** Verify this tag is completely removed from the Production build.

### Canonical URLs
- **Check:** Ensure every page outputs a `<link rel="canonical" href="...">` tag.
- **Blocker:** Ensure the canonical URL points to the final production domain (e.g., `https://trailers.com/movie/matrix`), NOT the internal Vercel/hosting URL (e.g., `https://trailers-proj-git-main.vercel.app/movie/matrix`).

### Sitemaps and Robots.txt
- **Check:** Visit `/robots.txt`. It must allow crawling (e.g., `Allow: /`) and must point to the absolute URL of the sitemap.
- **Check:** Visit `/sitemap.xml`. It must dynamically list all published movies and core taxonomy pages.

### Internal Linking & Duplicate Risks
- **Check:** Ensure the main navigation provides a clear crawl path to all major categories.
- **Check:** Verify that pagination (e.g., `/movies?page=2`) utilizes proper rel="next/prev" or canonical strategies to prevent duplicate content penalties.
