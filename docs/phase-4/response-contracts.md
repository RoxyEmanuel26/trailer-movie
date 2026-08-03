# Response Contracts

Consistency across API endpoints is critical so the frontend team (or framework) can predict payload shapes and build reusable data fetching hooks.

## Consistent Response Envelope
All public API responses will use a standard envelope.

### Success Structure
```json
{
  "success": true,
  "data": { ... }, // Payload goes here
  "meta": { ... } // Optional (e.g., pagination, cache status)
}
```

### Error Structure
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND", // Machine-readable code
    "message": "The requested movie was not found.", // Human-readable fallback
    "details": [] // Optional validation errors
  }
}
```

## Pagination Structure
Any endpoint returning a list (e.g., `/api/v1/movies`) must include pagination metadata.
```json
"meta": {
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 95,
    "next_url": "/api/v1/movies?page=2",
    "prev_url": null
  }
}
```

## Public vs. Admin Responses
- **Public Data Shape:** Must be strictly trimmed to include *only* what the frontend UI needs to render. Internal database IDs (unless necessary), `tmdb_id`, and `locked_fields` must be stripped out to reduce payload size and protect internal logic.
- **Admin Data Shape:** Returns raw, complete database representations, including timestamps, IDs, and sync tracking fields to allow full CRUD editing.
