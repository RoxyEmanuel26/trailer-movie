# Media Workflow

## Handling Assets

Media (posters, backdrops, cast photos) must be optimized and managed efficiently to prevent bloated page loads and messy media libraries.

### Uploading Assets
- When an editor uploads an image, the workflow intercepts the file before saving.
- **Conceptual Validation:** Check file type (JPEG, WebP, PNG) and minimum dimensions (e.g., block uploads smaller than 500x750px for posters to prevent blurry UI).

### Asset Processing (Behind the Scenes)
- The editor does not need to upload 5 different sizes.
- The workflow simply accepts the high-resolution original. A background service immediately generates the required responsive formats (e.g., WebP at 400px, 800px, 1200px) and uploads them to the CDN.

### Reusing Assets
- Instead of re-uploading the same "Action Genre" hero image multiple times, the workflow provides a Media Library picker.
- If an asset is updated in the Media Library, it updates everywhere it is referenced.

### Primary vs. Fallback
- For movies, an editor selects a `primary_poster`. 
- If a movie lacks a primary poster, the frontend relies on a system-wide fallback image defined in the Settings workflow.

### Removing Unused Assets
- The workflow should include an administrative tool to find "Orphaned Media"—images in the storage bucket that are no longer referenced by any database record—allowing safe deletion to save storage costs.
