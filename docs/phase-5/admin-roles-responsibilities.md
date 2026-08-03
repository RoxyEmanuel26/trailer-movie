# Admin Roles and Responsibilities

A robust Role-Based Access Control (RBAC) system ensures security and prevents accidental damage.

## 1. Super Admin
- **Responsibilities:** Full system control. Can alter global settings, manage other admins, and trigger system-wide operational tools.
- **Access:** Everything.
- **Restrictions:** None. Only Super Admins can permanently delete (hard delete) records or purge audit logs.

## 2. Content Editor
- **Responsibilities:** The primary day-to-day user. Curates movies, adds trailers, manages genres, and writes custom synopses.
- **Access:** Movies, Trailers, Cast, Genres, Media uploads.
- **Restrictions:** Cannot edit Homepage Sections, change global Settings, view Analytics, or manage Users. Can only *soft delete* content.

## 3. SEO Editor
- **Responsibilities:** Optimizes the site for search engines.
- **Access:** Read-only access to Movies. Write access to the SEO Overrides tab (Meta titles, descriptions, canonicals, URL slugs).
- **Restrictions:** Cannot change video URLs, movie posters, or core movie metadata (unless it directly impacts SEO).

## 4. Homepage/Layout Manager
- **Responsibilities:** Curates the front page of the platform.
- **Access:** The Homepage Builder module. Can dictate which collections or trending lists appear in which order.
- **Restrictions:** Does not have general CRUD access to movies, only the ability to reference them in layouts.

## 5. Analyst / Viewer
- **Responsibilities:** Monitors platform performance and user engagement.
- **Access:** Read-only access to Analytics, Traffic Reports, and Audit Logs.
- **Restrictions:** Cannot mutate any data in the system.
