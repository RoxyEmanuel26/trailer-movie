# Admin Navigation Architecture

The navigation sidebar is structured logically by frequency of use and domain context.

## Navigation Structure

### 1. Overview
- **Dashboard:** High-level metrics, pending alerts, and quick actions.
- **Analytics:** Traffic reports, top trailers, search query logs.

### 2. Content Management (Most Used)
- **Movies:** The primary data table.
- **Trailers:** Global list of all trailer links (useful for spotting broken links).
- **Genres & Taxonomy:** Manage tags, genres, and collections.
- **People (Cast/Crew):** Manage actor and director profiles.

### 3. Presentation & Curation
- **Homepage Builder:** Drag-and-drop interface for ordering sections.
- **Media Library:** Central repository for uploaded posters, backdrops, and avatars.
- **SEO & Routing:** Manage custom page slugs, canonicals, and meta overrides.

### 4. System & Security (Restricted)
- **Users & Roles:** Admin accounts and permission mapping.
- **Audit Logs:** Immutable trail of who changed what.
- **Operational Tools:** Cache clearing, manual cron triggers.
- **Settings:** Global platform configurations (e.g., API keys, maintenance mode toggle).

## Why this grouping?
- Editors spend 90% of their time in the **Content Management** section. Keeping these links grouped together at the top reduces cognitive load.
- **System & Security** tools are dangerous and rarely used; they are visually separated at the bottom of the sidebar (often behind a divider) to prevent accidental clicks.
