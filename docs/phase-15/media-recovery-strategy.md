# Media Recovery Strategy

## Restoring the Visuals

Losing the database means the site stops working. Losing the media bucket means the site looks broken. Both require rapid recovery.

### The Missing Asset Fallback
- **Immediate Mitigation:** If the primary media bucket goes down, the frontend application must be architected to handle 404 image errors gracefully. It should immediately display a branded placeholder (e.g., a "Poster Not Available" graphic) rather than a broken image icon, preserving the UI layout.

### Replica Bucket Promotion
- Because media assets are continuously replicated to a secondary bucket in a different region via Cross-Region Replication (CRR):
- **Recovery Action:** Update the CDN origin settings to point to the secondary bucket URL. This bypasses the broken primary bucket and restores images instantly. No data needs to be manually copied.

### Rebuilding Derived Assets
- We only back up *original* uploaded assets.
- If the bucket containing generated assets (e.g., the 300x450 WebP thumbnails generated from a 4K poster) is lost, we do *not* restore them from a backup.
- **Recovery Action:** A background job (Phase 14) is triggered to crawl the database, pull the original assets, and re-generate all required thumbnails asynchronously.
