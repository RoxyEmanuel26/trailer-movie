# Metadata Strategy

Metadata drives Click-Through Rate (CTR) from the Search Engine Results Page (SERP).

## 1. Title Tags (`<title>`)
- **Format (Movie Page):** `[Movie Title] ([Year]) - Official Trailers, Cast & Info | [Site Name]`
  - *Example: Dune: Part Two (2024) - Official Trailers, Cast & Info | TrailerBox*
- **Format (Genre Page):** `Best [Genre Name] Movie Trailers | [Site Name]`
- **Length Constraint:** Keep under 60 characters where possible to avoid truncation.

## 2. Meta Descriptions
- **Movie Page:** A dynamic blend: "Watch the official trailers for [Movie Title] ([Year]). [First 100 chars of synopsis...]"
- **Length Constraint:** Keep under 155 characters.

## 3. Open Graph (OG) and Twitter Cards
Essential for social sharing (Discord, iMessage, Twitter).
- `og:title` and `twitter:title` inherit from the meta title.
- `og:image` and `twitter:image` MUST point to the highest resolution Movie Backdrop (16:9 ratio), NOT the vertical poster, as social platforms prefer landscape images.
- `twitter:card` must be set to `summary_large_image`.

## 4. Language & Locale
- Include `<html lang="en">` (or dynamic based on content) to assist geo-targeting.
