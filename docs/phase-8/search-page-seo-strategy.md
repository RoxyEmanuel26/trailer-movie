# Search Result Page SEO Strategy

Internal search pages (`/search?q=query`) are incredibly useful for users, but highly dangerous for SEO.

## 1. The Crawl Trap Danger
If search pages are indexable, malicious actors (or even normal web crawlers) can generate millions of unique URLs simply by querying random text (e.g., `/search?q=ajhsgdfhg`). Googlebot will waste its entire crawl budget scanning these useless pages instead of finding new movie trailers.

## 2. The Solution
- **Global Noindex:** Every route starting with `/search` must output `<meta name="robots" content="noindex, follow">`.
- **Why "Follow"?** We still want Googlebot to follow the links on the search page if it accidentally lands there, ensuring it can discover the movie pages, but it will never index the search page itself.

## 3. Capturing High-Value Search Queries
- If internal analytics show 5,000 users searching for "Zombie Movies 2024" via the internal search bar, we do NOT make `/search?q=Zombie+Movies+2024` indexable.
- Instead, the SEO Manager creates a manual **Collection Page** (`/collection/zombie-movies-2024`), gives it a rich description, and lets *that* clean, curated URL rank in Google.
