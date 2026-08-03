# CRUD Workflow Design

Efficient content entry is the backbone of the CMS.

## 1. Create Movie (The Primary Workflow)
- **Entry Point:** Global "Create Movie" button in the header, or via the Movies list.
- **Workflow:** 
  1. Admin is prompted: "Import via TMDB ID" or "Create Manually".
  2. If TMDB ID is provided, the backend syncs the data and redirects to the Edit screen instantly.
  3. If Manual, a blank Draft is created.
- **Save Behavior:** Auto-saves as Draft every 30 seconds.

## 2. Edit Movie (The Hub)
The Edit Movie screen is a tabbed interface (General, Trailers, Cast, SEO, Settings) to prevent endless vertical scrolling.
- **Locking Fields:** Next to every field (Title, Synopsis, Release Date) is a small "Lock" toggle icon. Toggling it adds the field to the `locked_fields` array, preventing future TMDB syncs from overriding the admin's manual edit.
- **Preview:** A "Live Preview" button opens the frontend movie page in a new tab (passing a secure draft token if the movie is unpublished).

## 3. Add/Edit Trailer
- **Entry Point:** The "Trailers" tab inside the Movie Edit screen.
- **Workflow:** Admin pastes a YouTube URL. The UI immediately parses the ID, fetches the thumbnail via the YouTube API, and displays a preview. The admin selects the type (Teaser, Official, Featurette).
- **Validation:** Must be a valid YouTube/Vimeo URL pattern.

## 4. Delete/Archive Content
- **Workflow:** Clicking "Delete" opens a modal.
- **Confirmation Rules:** If deleting a Movie, the admin must type the exact movie title into an input box to confirm.
- **Behavior:** The action performs a Soft Delete (`deleted_at`). The movie disappears from default lists but can be recovered from the "Trash" view.
