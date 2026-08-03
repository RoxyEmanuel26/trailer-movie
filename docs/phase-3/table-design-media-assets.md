# Table Design: Media Assets

The `media_assets` table acts as a central registry for all files uploaded via the Admin CMS to cloud storage (e.g., AWS S3, Cloudflare R2).

## Fields
- **id** (UUID/BIGINT) - Primary Key
- **assetable_type** (VARCHAR) - Polymorphic type (e.g., `Movie`, `AdminUser`, `Genre`).
- **assetable_id** (UUID/BIGINT) - Polymorphic ID.
- **collection_name** (VARCHAR) - Required. Categorizes the asset (e.g., `poster`, `backdrop`, `avatar`).
- **file_name** (VARCHAR) - Required. The original filename.
- **mime_type** (VARCHAR) - Required. (e.g., `image/jpeg`, `image/webp`).
- **disk_path** (VARCHAR) - Required. The path on the storage disk (e.g., `/uploads/movies/dune-poster.webp`).
- **file_size_bytes** (INTEGER) - Required.
- **metadata** (JSON) - Optional. Stores image dimensions (width/height), alt text, or dominant color extraction.

## Timestamps
- **created_at**, **updated_at** (TIMESTAMP)

## Why use a central registry?
While we *could* just store `poster_url = 'https://s3.../image.jpg'` directly on the `movies` table, a dedicated `media_assets` table provides:
1. **Orphan Prevention:** If a movie is deleted, we can trigger an event to physically delete the associated files from S3 because we have a database record of them.
2. **Metadata Storage:** Storing width/height locally prevents layout shift (CLS) on the frontend without needing to download the image first.
3. **Multiple Assets:** Easily supports adding galleries (e.g., multiple production stills) to a movie later without altering the `movies` table schema.
