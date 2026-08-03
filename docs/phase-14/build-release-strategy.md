# Build and Release Strategy

## Artifacts and Versioning

A clean build and release strategy ensures that what we test in Staging is mathematically identical to what we deploy to Production.

### Build Artifact Expectations (Immutability)
- We do not run `npm install` and `npm run build` directly on the production server.
- The CI pipeline builds an immutable artifact (e.g., a Docker Image, or a compiled `.next` bundle zip).
- This *exact same artifact* is deployed to Staging. Once approved, that *exact same artifact* is promoted to Production. This eliminates the "it worked on my machine/staging" problem caused by differing dependency resolutions.

### Atomic Releases
- Deployments must be atomic.
- If a deployment involves 5 serverless functions and a static frontend, they must all swap to the new version simultaneously. Users should never receive the new HTML frontend while still hitting the old API backend, which causes version mismatch errors.

### Asset Versioning (Cache Busting)
- All compiled CSS, JS, and static assets must have content-hashes in their filenames (e.g., `main-a8f9c2.js`).
- This allows us to set infinite cache headers (`Cache-Control: public, max-age=31536000, immutable`) on the CDN. When a new release happens, the HTML simply requests the new hashed filenames, instantly busting the cache safely.

### Release Versioning
- Use Semantic Versioning (SemVer) for the underlying application (e.g., `v1.2.4`) tagged in Git.
- Maintain automated Release Notes generated from PR titles in GitHub, creating a clear changelog of what went into production.
