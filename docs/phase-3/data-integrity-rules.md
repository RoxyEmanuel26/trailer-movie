# Data Integrity & Validation Rules

## Constraints
- **Not Null:** Fields critical for routing (e.g., `slug`) or rendering (e.g., `title`) must have `NOT NULL` constraints at the database level, not just application-level validation.
- **Uniqueness:** Slugs across `movies`, `genres`, and `people` must be `UNIQUE`. If a title conflict occurs (e.g., "Dune" 1984 vs "Dune" 2021), the application logic must append the year to the slug before inserting, but the database must strictly enforce the uniqueness to prevent routing crashes.

## Foreign Key Rules & Deletion Behavior
- **ON DELETE CASCADE:** Pivot tables (`movie_genres`, `movie_people`) must cascade deletes. If a movie is deleted, its genre associations should automatically disappear.
- **ON DELETE RESTRICT:** Core taxonomies (`genres`) should restrict deletion if movies are attached to them. An admin must not be able to accidentally delete the "Action" genre if 500 movies rely on it.
- **Soft Deletes:** The `movies` table uses `deleted_at`. Deleting a movie hides it from public queries but preserves historical analytics and relationships. It can be restored by an admin.

## Status Constraints
- The `status` column (`draft`, `published`, `archived`) ensures incomplete data never reaches the public site. The default database state must always be `draft`.
