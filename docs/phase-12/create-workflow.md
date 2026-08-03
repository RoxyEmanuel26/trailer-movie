# Create Workflow

## Authoring New Content

The creation workflow prioritizes speed of entry while ensuring minimum data quality standards are met before publication.

### Entry Points
- Global "Quick Add" button in the admin navigation.
- Dedicated "Add New Movie" button on the Movies list view.

### Required Fields (Minimum Viable Draft)
To successfully save a Draft, the system requires the bare minimum:
- `title` (String)

### Auto-Generated Fields
- **Slug:** Automatically generated from the `title` (e.g., "The Matrix" -> `the-matrix`). Must be editable before publish in case of conflicts.
- **Created At:** Timestamp set by the database.
- **Created By:** Linked to the active Admin user ID.

### Validation Expectations
- **Draft Save:** Validation is extremely permissive. An editor can save a draft with missing posters, missing trailers, and incomplete synopses. This prevents data loss if the editor is interrupted.
- **Publish:** Validation is strict. See [Publish Workflow](publish-workflow.md) and [Validation Workflow](validation-workflow.md).

### External Sync (The "Fast Path")
For movies, the creation workflow should offer a "Fetch from TMDB" or similar external ID input.
1. Editor inputs an external ID.
2. System fetches metadata, posters, and cast.
3. System populates the Draft.
4. Editor reviews, modifies, and publishes. 
This turns a 10-minute manual entry task into a 10-second review task.
