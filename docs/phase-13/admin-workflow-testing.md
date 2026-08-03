# Admin Workflow Testing

## Ensuring Operational Safety

The admin dashboard is a complex application in its own right. Testing here focuses on data safety and workflow enforcement.

### Critical Admin Testing Focus Areas

1. **Validation Enforcement (Unit & Integration):**
   - Ensure the API strictly rejects publish attempts for movies missing primary assets.
   - Verify that slug uniqueness constraints work, returning clear error messages rather than raw database constraint violations.

2. **State Transitions (Lifecycle):**
   - Verify that an item marked as `Draft` does not appear in public API responses.
   - Verify that `Soft Deleted` items are successfully moved to the Trash view and can be restored perfectly to a draft state without losing relational data (like assigned genres).

3. **Bulk Operations (Integration):**
   - Create a test scenario with 50 movies. Trigger a bulk update to change their genre. Verify all 50 updated successfully in the database.
   - Verify that bulk operations correctly spawn background jobs (if architected that way) and do not cause HTTP timeouts.

4. **Media Replacement:**
   - Test that replacing a primary poster successfully updates the database record and triggers the necessary CDN cache invalidation commands.

5. **Sensitive Action Confirmations (E2E):**
   - E2E script: Click "Delete" on a movie -> Verify a confirmation modal appears -> Click "Cancel" -> Verify movie remains -> Click "Delete" again -> Click "Confirm" -> Verify movie is moved to trash.

6. **Role Boundary Enforcement:**
   - Authenticate as a standard `Editor`. Attempt to access the `/admin/settings` (Super Admin only) route. Verify access is denied (403). Attempt to execute a bulk delete via direct API call. Verify access is denied.
