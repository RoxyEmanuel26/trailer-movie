# Edit Workflow

## Modifying Existing Content

Editing must be safe. Modifying a live movie should never result in a broken public page while the editor is working.

### Revision-Based Editing
- When an editor opens a `Published` movie to make changes, the system creates a hidden `Draft` revision of that movie.
- The editor works on this Draft revision. The public site continues to serve the original `Published` version.
- **Save Draft:** Updates the hidden Draft revision. Public site is unaffected.

### Field-Level Editing Behavior
- Standard form inputs for text, textareas for synopses, and specialized widgets for relationships (e.g., a searchable multi-select for Genres).
- **Slug Locks:** Once a movie is published, the `slug` field is locked by default. Changing a slug breaks existing public URLs. If an editor unlocks and changes a slug, the system must conceptually support creating a 301 redirect from the old slug to the new one.

### Manual Overrides (External Sync)
- If a movie was populated via an external sync (e.g., TMDB), the editor can manually override specific fields (e.g., write a custom SEO-friendly synopsis).
- The system must track which fields are "synced" and which are "manual." Future automatic syncs must *never* overwrite a field that has been manually edited.

### Preview Behavior
- Editors must be able to click "Preview" to see how the Draft revision will look on the public frontend *before* it is published. This requires a secure preview route that bypasses standard caching and visibility rules for authenticated admins.
