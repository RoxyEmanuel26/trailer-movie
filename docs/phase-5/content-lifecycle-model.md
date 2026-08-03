# Content Lifecycle Model

All core content entities (Movies, Trailers) follow a strict lifecycle state to prevent incomplete data from reaching the public site.

## The States

### 1. Draft
- **Definition:** The initial state of all manually created content. Also applied if a TMDB import fails crucial validation (e.g., missing a poster).
- **Visibility:** Hidden from the public API entirely. Visible in the CMS with a grey "Draft" badge.

### 2. Published
- **Definition:** The content is live and indexed.
- **Visibility:** Available to the public API and frontend.

### 3. Archived (Optional)
- **Definition:** Content that is no longer relevant (e.g., a promotional trailer for a sweepstakes that has ended).
- **Visibility:** Removed from public lists and search, but the direct URL might still resolve (or 301 redirect).

### 4. Soft Deleted (Trash)
- **Definition:** Content the admin explicitly deleted.
- **Visibility:** Entirely inaccessible to the public (returns 404). Kept in the database for 30 days before a system cron job permanently purges it (Hard Delete). 

## Lifecycle Workflow
- Changing a Movie from Draft to Published requires a system validation check (Does it have a title? Does it have at least one trailer? Does it have a poster?). If validation fails, the publish action is blocked and errors are highlighted.
