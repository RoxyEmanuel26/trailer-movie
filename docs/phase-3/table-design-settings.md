# Table Design: Settings

The `settings` table provides a key-value store for global application configuration that admins can change without deploying code.

## Fields
- **id** (UUID/BIGINT) - Primary Key
- **key** (VARCHAR) - Required, Unique. e.g., `site_name`, `maintenance_mode`, `google_analytics_id`.
- **value** (TEXT) - Required. The stringified value.
- **type** (ENUM) - Required. `string`, `boolean`, `integer`, `json`. Guides the admin UI on how to render the input (e.g., as a toggle switch or a text field).
- **group** (VARCHAR) - Optional. e.g., `general`, `seo`, `integrations`. Used to organize settings into tabs in the CMS.
- **created_at**, **updated_at** (TIMESTAMP)

## Cache Strategy
The `settings` table is read on almost every page load. It must be heavily cached. 
- **Rule:** Upon any `update` to the `settings` table, the application must invalidate the global `app_settings` cache key.
