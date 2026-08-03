# Table Design: Trailers

The `trailers` table stores the actual video assets associated with a movie.

## Fields
- **id** (UUID/BIGINT) - Primary Key
- **movie_id** (UUID/BIGINT) - Foreign Key to `movies`. Required.
- **title** (VARCHAR) - Required. e.g., "Official Main Trailer", "Teaser 2".
- **source_type** (ENUM) - Required. e.g., `youtube`, `vimeo`, `native`. (Defaults to `youtube`).
- **source_id** (VARCHAR) - Required. The identifier from the source (e.g., YouTube video ID `dQw4w9WgXcQ`).
- **video_type** (ENUM) - Required. `teaser`, `trailer`, `featurette`, `clip`.
- **is_primary** (BOOLEAN) - Required. Indicates if this is the main trailer that should auto-load on the movie detail page. Only one trailer per movie should be `true`.
- **published_date** (DATE) - Optional. When the trailer was officially released.
- **duration_seconds** (INTEGER) - Optional. Length of the video.
- **thumbnail_url** (VARCHAR) - Optional. Override for the default YouTube thumbnail (for higher resolution facades).
- **status** (ENUM) - Required. `active`, `inactive` (used if the YouTube video gets taken down).

## Timestamps
- **created_at** (TIMESTAMP)
- **updated_at** (TIMESTAMP)

## Indexes
- `INDEX(movie_id)` - Required for fast fetching of a movie's trailers.
- `COMPOUND INDEX(movie_id, is_primary)` - Used to quickly fetch just the main trailer for grid layouts.
- `UNIQUE(movie_id, source_id)` - Prevents accidental duplicate inserts of the same YouTube video for a movie.
