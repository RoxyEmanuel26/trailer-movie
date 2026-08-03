# Security & Abuse Prevention

The API layer must defend against scraping, denial of service, and unauthorized access.

## 1. Rate Limiting
- **Public GET Endpoints:** High limit (e.g., 200 req/min per IP). Relies mostly on CDN caching to absorb the load.
- **Search API:** Medium limit (e.g., 60 req/min per IP). Search is computationally expensive and difficult to cache, making it a target for abuse.
- **Admin Auth (`/login`):** Extremely strict limit (e.g., 5 attempts per 15 minutes per IP) to prevent brute-force password guessing.

## 2. Request Validation
- **Rule:** The API must NEVER trust incoming payload structures.
- **Implementation:** Use a validation schema (like Zod) on every `POST` and `PUT` route. If the payload does not strictly match the expected types, return a `400 Bad Request` with exact details before the request reaches the Service layer.

## 3. Payload Size Limits
- Limit JSON request bodies to `100kb` to prevent memory exhaustion attacks.
- File uploads (`POST /api/admin/media/upload`) are limited to `5MB` for images.

## 4. Secret Protection
- TMDB API keys, YouTube API keys, and Database credentials must be injected via Environment Variables (`.env`) and must NEVER be exposed to the frontend browser bundle.
- The Service layer accesses these variables securely via a centralized config file, failing fast on startup if a required secret is missing.
