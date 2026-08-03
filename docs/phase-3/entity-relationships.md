# Entity Relationships

## One-to-Many (1:N)
- **Movie -> Trailers (1:N):** A movie can have multiple trailers, but a trailer belongs to exactly one movie.
- **Role -> Admin Users (1:N):** A role (e.g., "Editor") can be assigned to many users, but a user has only one primary role (simplified RBAC).
- **Movie -> SEO Page (1:1):** While theoretically 1:1, it's often implemented as an optional 1:1 relation where a movie *may* have a dedicated SEO override record.

## Many-to-Many (N:M)
- **Movies <-> Genres:** A movie can have multiple genres (Action, Sci-Fi) and a genre contains many movies. Requires pivot table `movie_genres`.
- **Movies <-> People (Cast/Crew):** A movie has many actors/directors. A person acts in many movies. Requires pivot table `movie_people`, which also stores the `role` (Director, Actor) and `character_name`.
- **Movies <-> Studios:** A movie can be co-produced by multiple studios. Requires pivot table `movie_studios`.
- **Movies <-> Collections:** A movie can belong to multiple collections ("Summer Blockbusters", "Oscar Winners"). Requires pivot table `movie_collections`.
- **Movies <-> Countries/Languages:** A movie can have multiple countries of origin and multiple spoken languages. Requires pivot tables `movie_countries` and `movie_languages`.

## Optional Relationships
- **External Sources:** A movie *may* be linked to an `external_source` (e.g., TMDB ID) for syncing. If manually created, this relationship is null.

## Polymorphic Relationships
- **Media Assets:** A polymorphic relationship `assetable` (assetable_id, assetable_type) allows the `media_assets` table to attach images to a Movie (as a custom poster), a Person (as a headshot), or a Genre (as a banner image) without creating multiple foreign key columns.
- **SEO Pages:** An SEO record can apply to a static page route, a Movie, or a Genre via a polymorphic relationship (`seoable_id`, `seoable_type`).
