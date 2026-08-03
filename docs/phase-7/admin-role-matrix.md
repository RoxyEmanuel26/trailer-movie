# Admin Role Matrix

Below defines the exact access boundaries for the standard admin roles.

## 1. Super Admin
- **Allowed:** Everything.
- **Restricted:** Nothing.
- **Sensitive Actions:** Hard deletions, Role/Permission changes, Global Settings updates, API key rotation. Requires password confirmation.

## 2. Content Editor
- **Allowed:** Create/Edit/Soft-Delete Movies, Trailers, Genres, Cast. Trigger TMDB syncs. Upload Media.
- **Restricted:** Hard deletions, User Management, Global Settings, SEO overrides (if handled by a dedicated SEO team).

## 3. SEO Editor
- **Allowed:** Edit SEO metadata on Movies and Genres. Manage redirect rules.
- **Restricted:** Cannot change trailer links, core movie metadata, or upload posters.
- **Read-Only:** Can view the Movies list to find records to optimize.

## 4. Media Manager
- **Allowed:** Upload, tag, and replace media assets in the Media Library.
- **Restricted:** Cannot change movie text content or SEO data.

## 5. Analyst
- **Allowed:** View Analytics dashboard, read Audit Logs.
- **Restricted:** Strict read-only access. Cannot mutate any data in the CMS.

## 6. Homepage Layout Manager
- **Allowed:** Edit Homepage Sections (ordering, titles, visibility).
- **Restricted:** Cannot edit the actual Movies inside the sections.
