# Content Types and Ownership

## Managed Entities

The CMS manages several distinct types of content, each with specific ownership and permissions.

### 1. Movies
- **Definition:** The core entity representing a film. Contains metadata (title, release date, synopsis) and relationships.
- **Ownership:** Content Editors.
- **Permissions:** Editors can create, edit, and publish.

### 2. Trailers (Video Assets)
- **Definition:** The video files or external embed links associated with a movie.
- **Ownership:** Content Editors / Media Managers.
- **Permissions:** Editors can assign/replace links. Media Managers can upload/manage raw files if self-hosted.

### 3. Genres & Taxonomy
- **Definition:** Categories (Action, Sci-Fi) and Tags used to classify movies.
- **Ownership:** Senior Editors / Taxonomy Managers.
- **Permissions:** Restricted. Standard editors can *assign* genres to a movie, but cannot *create* or *delete* a genre to prevent taxonomy sprawl.

### 4. Collections
- **Definition:** Curated lists of movies (e.g., "Best Action Movies of 2023").
- **Ownership:** Content Editors / Curation Team.
- **Permissions:** Editors can create, edit, and order collections.

### 5. Homepage Sections
- **Definition:** The structure and content featured on the main index page (Hero carousel, curated rows).
- **Ownership:** Senior Editors / Marketing.
- **Permissions:** Highly restricted due to visibility. Requires Senior Editor access to modify.

### 6. SEO Pages & Settings
- **Definition:** Dedicated SEO landing pages (e.g., `/year/2023`) and site-wide metadata.
- **Ownership:** SEO Specialists / Marketing.
- **Permissions:** SEO team controls these specific fields; standard editors may only edit movie-level SEO fields.

### 7. Media Assets (Posters/Backdrops)
- **Definition:** Static images used for UI presentation.
- **Ownership:** Content Editors.
- **Permissions:** Editors can upload and crop.

### 8. System Settings
- **Definition:** Global toggles (e.g., "Enable holiday theme", "Maintenance mode").
- **Ownership:** System Administrators.
- **Permissions:** Admins only.
