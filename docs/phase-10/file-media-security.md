# File and Media Security

## Safe Handling of Assets

If the admin panel allows the uploading of images (posters, backdrops) or referencing external media, strict controls are necessary to prevent malicious file hosting.

### File Type Restrictions
- Strictly whitelist allowed file extensions (e.g., `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`).
- Do not rely solely on the file extension. Verify the actual MIME type of the uploaded file by inspecting its "magic numbers" (file header) on the server. Reject anything that doesn't match the whitelist (e.g., rejecting an `.exe` renamed to `.jpg`).

### File Size Limits
- Implement strict maximum file sizes (e.g., 5MB for images) to prevent storage exhaustion and DoS via massive uploads.

### Image Safety Expectations
- Process all uploaded images through an image manipulation library (e.g., Sharp, ImageMagick) to resize and optimize them. This process typically strips out malicious payloads hidden within image files.

### Metadata Stripping Rules
- Automatically strip EXIF data and other metadata from uploaded images to prevent accidental leakage of sensitive information (like GPS coordinates of the uploader).

### Remote Image Trust Rules
- If the system allows fetching images from remote URLs (e.g., TMDB), ensure the server making the request validates the response type and size before saving it to our own storage. Set timeouts on these fetches to prevent Server-Side Request Forgery (SSRF) or hanging connections.

### CDN or Storage Access Rules
- Store user-uploaded files in a dedicated storage bucket (e.g., AWS S3).
- Configure the bucket so that files are publicly readable (if intended for the frontend) but can ONLY be written to or deleted by the authenticated backend application, never directly from the client.

### Unsafe File Handling Prevention
- Never store uploaded files directly on the same disk where the application code executes if it can be avoided.
- Never execute uploaded files. Ensure the web server serving the files is configured to serve them as static assets, not as executable scripts (e.g., disabling PHP execution in the uploads directory if using Apache/Nginx).
