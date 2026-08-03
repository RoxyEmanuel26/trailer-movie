# Admin API Strategy

The Admin API endpoints (`/api/admin/*`) are strictly separated from public routes. They expose raw, un-cached data to power the CMS.

## 1. CRUD Endpoints
- Admin routes map directly to standard REST principles (`GET`, `POST`, `PUT`, `DELETE`).
- **Data Completeness:** Unlike public endpoints which trim data, a `GET /api/admin/movies/:id` returns everything: `created_at`, `tmdb_id`, `locked_fields`, allowing the admin UI to build complex editing forms.

## 2. Sub-Resource Management
Rather than massive, unwieldy `PUT` payloads, complex relationships are managed via sub-routes:
- `POST /api/admin/movies/:id/trailers` - Adds a new trailer to a movie.
- `DELETE /api/admin/movies/:id/cast/:person_id` - Removes an actor from a movie.

## 3. The Sync Action Endpoint
- The CMS features an "Import from TMDB" button. 
- This fires a `POST /api/admin/sync/tmdb` request with the TMDB ID.
- The backend executes the sync synchronously and returns the fully populated local Movie object. The frontend then redirects the user to the newly created edit page.

## 4. Media Upload Endpoints
- `POST /api/admin/media/upload` accepts `multipart/form-data`.
- The `MediaService` uploads the file directly to the storage bucket, logs it in the `media_assets` table, and returns the CDN URL to the admin UI for previewing.
