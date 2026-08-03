# Identity Model

The system must distinguish between different types of actors interacting with the application.

## 1. Public Anonymous Visitor
- **Intent:** Browsing trailers, discovering movies.
- **State:** Unauthenticated. No database record exists for them (beyond anonymized analytics).
- **Access:** Read-only access to public routes.

## 2. Admin User
A generic authenticated identity that has access to the CMS. An Admin User is assigned one or more specific roles.

### Specific Admin Roles:
- **Super Admin:** The ultimate authority. Can manage other users, alter global settings, and perform hard deletes.
- **Content Editor:** The core workforce. Can create, edit, and soft-delete movies, trailers, and taxonomy.
- **SEO Manager:** Can edit metadata (titles, descriptions, canonicals) but cannot alter core movie data like release dates or video URLs.
- **Media Manager:** Responsible for uploading and organizing posters and backdrops.
- **Analyst:** Read-only access to the CMS to view traffic, audit logs, and performance metrics.

## 3. Future Public User
- **Intent:** Saving favorites, creating watchlists.
- **State:** Authenticated, but heavily restricted.
- **Access:** Cannot access any CMS routes. Can only mutate data tied directly to their own `user_id`.
