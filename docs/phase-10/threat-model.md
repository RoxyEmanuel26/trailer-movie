# Threat Model

## Relevant Threat Categories

The following threats have been identified as the most critical risks to the application.

### Credential Theft
- **Why it matters:** Phishing, weak passwords, or reused passwords could allow attackers to gain admin access. This bypasses most technical security controls.

### Brute-Force Login Attempts
- **Why it matters:** Automated scripts attempting to guess admin passwords. Without rate limiting, this can lead to account compromise or denial of service on the authentication service.

### Unauthorized Admin Access
- **Why it matters:** Exploiting flaws in session management, authorization checks, or API endpoints to perform administrative actions without valid credentials. Leads to full content compromise.

### Privilege Escalation
- **Why it matters:** A low-level admin (e.g., an "Editor") finding a way to execute actions reserved for a "Super Admin" (e.g., deleting other users, altering system settings).

### Data Tampering
- **Why it matters:** Modifying database records directly or via API exploits to alter movie information, inject malicious links, or corrupt the platform's integrity.

### Content Abuse
- **Why it matters:** If user-generated content (comments, reviews) is ever introduced, or if admins act maliciously, uploading inappropriate text, spam, or malicious URLs damages the brand and harms users.

### Spam or Bot Abuse
- **Why it matters:** Automated bots hitting search endpoints, filling out contact forms, or aggressively scraping the site can drive up server costs and degrade performance for real users.

### Scraping Abuse
- **Why it matters:** Competitors or bad actors ripping the curated movie database at scale.

### Injection Risks (SQL/NoSQL, Command)
- **Why it matters:** Unsanitized input allowing an attacker to execute arbitrary commands on the database or underlying server, leading to data exfiltration or total system takeover.

### Cross-Site Request Risks (CSRF)
- **Why it matters:** Tricking an authenticated admin's browser into executing unwanted actions on the application without their knowledge.

### Secret Leakage
- **Why it matters:** Accidentally committing API keys to version control, exposing `.env` files, or leaking keys in client-side JavaScript allows attackers to impersonate the application or access external services at our expense.

### Malware or Malicious File Upload Risks
- **Why it matters:** If the admin panel allows image or video uploads, failing to validate these files could allow attackers to host malware on our domain or execute malicious scripts on the server.

### Provider Abuse or API Key Abuse
- **Why it matters:** Attackers extracting public-facing API keys (e.g., for a search provider like Algolia) and exhausting the quota, leading to service outages and massive billing spikes.
