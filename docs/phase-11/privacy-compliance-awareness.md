# Privacy and Compliance Awareness

## Ethical Tracking

Analytics must not compromise user privacy. The architecture must prioritize data minimization.

### Minimal Collection Principles
- Only collect data that is actively used for a defined measurement goal. Do not collect data "just in case it's useful later."

### Personal Data Avoidance
- Do not collect names, email addresses, or phone numbers in the standard behavioral analytics stream.
- If user accounts are added later, analytics events should refer to users by an opaque, hashed internal ID, never by their plain-text identifier.

### IP and Device Data Handling
- IP addresses are considered Personal Data under frameworks like GDPR.
- Do not store raw IP addresses in the analytics database.
- Use the IP at the ingestion layer to look up the geographic region (Country/City) and then immediately discard or hash the IP address before writing the event to storage.

### Consent or Notice Considerations
- Design the analytics tracking to be cookieless or entirely anonymous by default where possible to minimize compliance overhead (e.g., cookie banners).
- If tracking relies on persistent identifiers (cookies) that track behavior across multiple days, ensure the architecture supports integrating with a Consent Management Platform (CMP) in the future to suppress tracking until consent is granted.

### Admin Data Sensitivity
- While public users are anonymous, admin users are known. Admin analytics (audit logs) inherently contain PII (the admin's identity). This is justified for security and operational integrity, but these logs must be subject to the strict access controls defined in the Security Architecture (Phase 10).
