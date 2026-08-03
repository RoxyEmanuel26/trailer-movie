# Data Sync Strategy

Relying entirely on manual data entry for movies is unscalable. We will synchronize baseline data from an external provider (e.g., TMDB).

## Sync Process
1. **Trigger:** An admin inputs a TMDB ID into the CMS and clicks "Import".
2. **Fetch:** The backend fetches Movie details, Cast, Genres, and Trailer URLs from TMDB.
3. **Upsert:** 
   - Insert new records into `movies`, `people`, `genres`.
   - Setup relationships in pivot tables (`movie_people`, `movie_genres`).

## Protecting Manual Edits (The "Locked Fields" Pattern)
If an admin manually corrects a typo in a movie's synopsis, a subsequent TMDB sync must **not** overwrite it.
- **Implementation:** The `movies` table contains a JSON column `locked_fields`. 
- **Behavior:** If the admin updates the `synopsis` via the CMS, the backend appends `"synopsis"` to the `locked_fields` array. During the TMDB sync, the script checks if `locked_fields.includes("synopsis")`. If true, the incoming TMDB synopsis is discarded.

## Handling Trailer Takedowns
- External trailer links (YouTube) frequently go dead.
- **Strategy:** A nightly background job will execute a lightweight `HEAD` request to all active `youtube` source URLs in the `trailers` table. If the API returns a 404 or Private status, the trailer's `status` is updated to `inactive`, and an alert is logged to the `audit_logs` for admin review.
