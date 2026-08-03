# Change Log Strategy

## Recording the "What"

While Decision Logs record structural philosophy, Change Logs record the actual, tangible modifications made to the live product over time.

### What Goes in the Changelog
- **Code/Feature Changes:** New functionality added to the UI or Admin panel.
- **Architecture Changes:** Major dependency upgrades (e.g., Next.js 14 to 15).
- **SEO/Security Changes:** Adjustments to canonical routing, caching headers, or auth expiration times.
- **Operational Changes:** Moving from one hosting tier to another.

### Format (Keep a Changelog)
We follow the standard [Keep a Changelog](https://keepachangelog.com/) format in a root `CHANGELOG.md` file.

Entries are grouped by Release Version and categorized by:
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

### Decision Log vs. Change Log
- **Decision Log (ADR):** *October 1st: We decided to implement a Dark Mode toggle to improve user retention based on feedback. We chose Tailwind dark classes.*
- **Change Log:** *October 15th (v1.2.0) - Added: Dark Mode toggle in the main navigation.*
