# Future Expansion Notes

The schema is designed to easily accommodate Phase 2/3 features without requiring massive data migrations or structural overhauls.

## 1. User Accounts & Watchlists
- **Implementation:** Create a `users` table (distinct from `admin_users`). Add a pivot table `user_watchlists` (`user_id`, `movie_id`, `added_at`).
- **Readiness:** The `movies` table uses UUIDs/BIGINTs, making it trivial to link to a future user schema.

## 2. Ratings & Reviews
- **Implementation:** Create a `reviews` table (`user_id`, `movie_id`, `rating`, `comment`). 
- **Readiness:** To maintain performance, the `movies` table would simply need an `average_rating` float column and a `total_reviews` integer column added, which would be updated via database triggers or background jobs whenever a review is posted.

## 3. AI Features & Semantic Search
- **Implementation:** Vector embeddings for "More like this" recommendations.
- **Readiness:** The `movies` table is structured cleanly so its metadata (synopsis + genres + tags) can be easily piped into an embedding model (like OpenAI `text-embedding-3`). We can simply add a `vector_embedding` column (using Postgres `pgvector` extension) to the `movies` table in the future.

## 4. Ticketing / Affiliate Out-linking
- **Implementation:** External "Buy Tickets" links.
- **Readiness:** Can be supported by adding a simple JSON column `affiliate_links` to the `movies` table, or creating a dedicated `movie_affiliates` 1:N table if click-tracking per vendor requires high granularity.
