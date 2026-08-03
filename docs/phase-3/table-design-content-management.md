# Table Design: Content Management (CMS)

These tables define the layout and curated groupings for the frontend, specifically the homepage.

## 1. `collections` Table
Curated groupings of movies (e.g., "Summer Blockbusters 2024").
- **id** (UUID/BIGINT) - Primary Key
- **title** (VARCHAR) - Required.
- **slug** (VARCHAR) - Required, Unique.
- **description** (TEXT) - Optional.
- **is_active** (BOOLEAN) - Required. Defaults to `false`.

**Pivot Table:** `collection_movies`
- `collection_id`, `movie_id`
- **sort_order** (INTEGER) - Required. Allows admins to manually order movies in a collection.

## 2. `homepage_sections` Table
Defines the vertical rows shown on the homepage.
- **id** (UUID/BIGINT) - Primary Key
- **title** (VARCHAR) - Required. (e.g., "Trending Now", "Action Favorites").
- **type** (ENUM) - Required. `auto_recent`, `auto_upcoming`, `manual_collection`, `ad_slot`.
- **collection_id** (UUID/BIGINT) - Optional. Foreign Key to `collections`. (Required if type is `manual_collection`).
- **sort_order** (INTEGER) - Required. Defines vertical placement on the homepage.
- **is_active** (BOOLEAN) - Required.

## 3. `featured_items` Table
Items explicitly pinned to the top hero carousel.
- **id** (UUID/BIGINT) - Primary Key
- **movie_id** (UUID/BIGINT) - Foreign Key to `movies`.
- **custom_headline** (VARCHAR) - Optional. Overrides the movie title in the hero.
- **custom_backdrop_url** (VARCHAR) - Optional. Overrides the default movie backdrop.
- **sort_order** (INTEGER) - Required.
- **is_active** (BOOLEAN) - Required.
- **start_date** (TIMESTAMP) - Optional. For scheduling features.
- **end_date** (TIMESTAMP) - Optional. For scheduling features.
