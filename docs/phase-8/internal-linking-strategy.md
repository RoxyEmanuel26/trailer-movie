# Internal Linking Strategy

Internal links distribute "Link Equity" (PageRank) throughout the site, ensuring deep pages are crawled frequently.

## 1. Hub-to-Spoke Linking
- **The Hubs:** `/trending`, `/upcoming`, `/top-rated`. These pages naturally attract backlinks.
- **The Spokes:** The individual `/movie/[slug]` pages. 
- By ensuring every new movie appears on the `/upcoming` page, we guarantee Googlebot finds and indexes new trailers almost immediately.

## 2. Lateral Linking (Related Content)
- **Movie-to-Movie:** Every Movie Detail page must feature a "More Like This" row. This creates a dense web of lateral links, keeping both users and crawlers moving through the site.
- **Movie-to-Genre:** The Genre pills on a Movie Detail page (e.g., `[Sci-Fi]`) must be anchor tags linking back to the Genre hub. This passes authority back up the chain.

## 3. Breadcrumbs
- Breadcrumbs are not just for UI; they are physical anchor tags that reinforce the vertical hierarchy of the site.

## 4. Footer Linking
- The footer should contain links to the top 5-10 most valuable Genre/Collection pages. Because the footer appears on every page, these links receive massive internal authority, boosting their rankings for broad terms like "Horror Trailers".
