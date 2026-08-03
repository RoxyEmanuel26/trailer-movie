# Authentication Philosophy

## Purpose
The authentication and authorization architecture exists to protect the integrity of the platform's database and CMS, ensuring that only trusted personnel can alter content, while allowing the public to browse freely and anonymously.

## Core Principles
1. **Default Deny for CMS:** All routes and API endpoints within the `/admin` or `/api/admin` scope are strictly locked down by default. Access must be explicitly granted.
2. **Default Allow for Public:** All routes within the public scope (`/`, `/movies/*`) are entirely open. 
3. **Least Privilege:** Admin users should only be given the permissions necessary to perform their specific job (e.g., an SEO manager should not be able to delete a movie).
4. **Assume Breach:** Security measures must assume that an admin's password might eventually be compromised. Sensitive, destructive actions require re-verification.

## Risk Minimization
The primary risks are:
- Malicious deletion of the movie catalog.
- Defacement of the homepage.
- Scraping of internal API endpoints.

This architecture mitigates these risks through strict Role-Based Access Control (RBAC), robust audit logging, and rate limiting.
