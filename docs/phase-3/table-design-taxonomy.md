# Table Design: Taxonomy

Taxonomy tables categorize and organize the movie catalog.

## 1. `genres` Table
- **id** (UUID/BIGINT) - Primary Key
- **name** (VARCHAR) - Required. e.g., "Sci-Fi".
- **slug** (VARCHAR) - Required, Unique. e.g., `sci-fi`.
- **description** (TEXT) - Optional. Used for SEO headers on genre pages.
- **tmdb_id** (INTEGER) - Optional.

**Pivot Table:** `movie_genres`
- `movie_id`, `genre_id`
- Primary Key: `(movie_id, genre_id)`

## 2. `tags` Table (Folksonomy)
For non-standard, flexible categorization (e.g., "Based on a true story", "Mind-bending").
- **id** (UUID/BIGINT) - Primary Key
- **name** (VARCHAR) - Required.
- **slug** (VARCHAR) - Required, Unique.

**Pivot Table:** `movie_tags`
- `movie_id`, `tag_id`
- Primary Key: `(movie_id, tag_id)`

## 3. `countries` and `languages`
Used for filtering foreign films.
- **id** (UUID/BIGINT) - Primary Key
- **iso_code** (VARCHAR) - Required, Unique. e.g., `US`, `FR`, or `en`, `es`.
- **name** (VARCHAR) - Required. e.g., "United States", "English".

**Pivot Tables:** `movie_countries`, `movie_languages`
- `movie_id`, `country_id`/`language_id`
