# Media Management Design

The admin panel must centralize media handling to prevent orphaned files and ensure frontend performance.

## 1. Central Media Library
All uploads go to the `media_assets` table, not directly to the `movies` table.
- **Reuse:** If three different collections use the same "Summer Blockbusters" banner, it is uploaded once and referenced three times via the polymorphic relationship.

## 2. The Upload Workflow
- **Drag and Drop:** Admin drags an image into a dropzone on the Movie Edit screen (e.g., uploading a custom poster).
- **Validation:** 
  - Only `.jpg`, `.png`, and `.webp` allowed.
  - Max file size: 5MB.
- **Processing:** The frontend immediately shows a preview. Upon save, the image is sent to the backend, which uploads it to S3/Cloudflare R2 and returns the CDN URL.

## 3. Fallback and Override Logic
- The UI must clearly indicate the difference between an external image and a custom override.
- **UI Element:** A toggle or distinct visual block. "Currently using TMDB poster. [Upload Custom Poster]".
- If a custom poster is uploaded, the TMDB poster URL is ignored by the frontend.

## 4. Asset Deletion
- If an admin clicks "Delete Asset" in the Media Library, the system checks if the asset is currently attached to any active entity (Movie, Genre).
- If attached, the deletion is blocked with a warning: "Cannot delete. Asset is in use by 'Dune: Part Two'."
