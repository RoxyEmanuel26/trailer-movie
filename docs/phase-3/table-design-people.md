# Table Design: People (Cast & Crew)

The `people` table stores information about actors, directors, and writers.

## 1. `people` Table
- **id** (UUID/BIGINT) - Primary Key
- **name** (VARCHAR) - Required.
- **slug** (VARCHAR) - Required, Unique. e.g., `timothee-chalamet`.
- **biography** (TEXT) - Optional.
- **headshot_url** (VARCHAR) - Optional.
- **tmdb_id** (INTEGER) - Optional, Unique. For external sync.
- **created_at**, **updated_at** (TIMESTAMP)

## 2. Pivot Table: `movie_people`
Connects a movie to a person and defines their role in that specific film.

- **movie_id** (UUID/BIGINT) - Foreign Key to `movies`.
- **person_id** (UUID/BIGINT) - Foreign Key to `people`.
- **role_type** (ENUM) - Required. `director`, `actor`, `writer`, `producer`.
- **character_name** (VARCHAR) - Optional. E.g., "Paul Atreides". (Only applicable if `role_type` is `actor`).
- **sort_order** (INTEGER) - Optional. Used to ensure top billing actors appear first.

## Constraints & Indexes
- **Primary Key** on `movie_people`: `(movie_id, person_id, role_type)`. A person can be both a director and an actor in the same movie.
- `INDEX(person_id)` on `movie_people` - Used for "See all movies directed by Christopher Nolan" queries.
- `INDEX(movie_id)` on `movie_people`.
