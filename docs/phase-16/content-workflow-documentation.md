# Content Workflow Documentation

## The Editor's Manual

Non-technical users manage the movie catalog. Their documentation must focus entirely on the UI and the business rules, avoiding any mention of databases or APIs.

### Required Guides

1. **The Lifecycle Guide:**
   - Explains the difference between Draft, Published, and Archived states (Phase 12).
   - Explains what fields are mandatory before a movie can transition to Published.

2. **Media Handling:**
   - Exact specifications for uploads: "Posters must be at least 1000x1500px, JPG or PNG. The system will crop them automatically."
   - How to replace an existing poster without breaking the site.

3. **SEO and Metadata Editing:**
   - Explains the fallback logic: "If you leave the Custom SEO Title blank, the system will automatically generate it based on the Movie Title and Year."

4. **Bulk Operations:**
   - Step-by-step instructions for adding a genre to 50 movies at once.
   - Warnings about the impact of bulk deletions.

5. **Handling Edge Cases:**
   - "What do I do if a movie doesn't have a release date yet?" (Instructions on how to use the 'TBD' flag).
   - "How do I feature a movie on the Homepage Carousel?"

### Format
Content Workflow documentation should rely heavily on screenshots, GIFs, or short Loom videos demonstrating the exact UI clicks required to perform the action.
