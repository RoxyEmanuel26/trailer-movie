# Input Validation and Sanitization

## Handling External Data Safely

Never trust input from the client. All data crossing the boundary into the application must be scrutinized.

### Required Validation at Boundaries
- Every API endpoint and form submission handler must validate its input before processing.
- Use a robust validation library (e.g., Zod, Joi, Yup) to define strict schemas for expected payloads.

### Type and Length Validation
- Ensure strings are actually strings, numbers are numbers, etc.
- Enforce strict length limits on all text fields (e.g., a movie title cannot be 50,000 characters long) to prevent buffer overflows or database truncation errors.

### HTML or Rich Text Sanitization
- If the admin panel allows rich text input (e.g., for movie synopses), the input MUST be sanitized on the server side using a trusted HTML sanitizer (like DOMPurify on the server, or similar libraries) to strip out `<script>` tags, malicious `<iframe>`s, and unsafe attributes.
- Never rely solely on client-side WYSIWYG editors for sanitization.

### URL Validation
- When accepting URLs for trailers (e.g., YouTube links) or external resources, strictly validate that the input is a well-formed URL.
- Restrict protocols to `http://` and `https://` to prevent `javascript:` or `data:` URI attacks.
- Optionally, validate that the URL points to an approved domain (e.g., only allow `youtube.com` or `vimeo.com` for trailers).

### Slug Validation
- Ensure URL slugs only contain alphanumeric characters and hyphens. Reject special characters, spaces, or path traversal sequences (`../`).

### Search Term Validation
- Sanitize search inputs to prevent injection attacks if the search is passed directly to a database or search engine. Limit the length of search queries to prevent DoS via overly complex regex or wildcard searches.

### Metadata Field Validation
- Validate JSON payloads for metadata to ensure they adhere to expected structures and do not contain executable code or excessively deep nesting.
