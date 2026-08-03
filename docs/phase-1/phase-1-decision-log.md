# Phase 1 Decision Log

This document records the major architectural and product decisions made during Phase 1. This serves as historical context to prevent re-litigating settled discussions in the future.

## DECISION 001: Video Hosting Strategy
- **Decision:** Use third-party iframe embeds (specifically YouTube) for all trailer videos instead of self-hosting native `.mp4` files.
- **Reasoning:** Self-hosting video requires massive bandwidth, expensive storage, and complex transcoding pipelines to support different device resolutions. YouTube handles all of this for free.
- **Trade-off:** We lose control over the video player UI, we cannot insert our own pre-roll ads, and we are vulnerable to videos being marked private by the uploader. 

## DECISION 002: Deferring User Accounts to Phase 2
- **Decision:** The MVP will be entirely public-facing with no ability for end-users to register, log in, or save movies.
- **Reasoning:** Implementing robust authentication, password resets, and user data models significantly expands the MVP scope. Our primary goal is to validate the core consumption experience and establish SEO rankings first.
- **Trade-off:** We cannot build retention loops like "Email me when this trailer drops" or personalized watchlists at launch.

## DECISION 003: Manual Data Entry for MVP
- **Decision:** The Phase 1 CMS will require admin users to manually enter movie metadata rather than automatically syncing with external APIs like TMDB.
- **Reasoning:** API integrations require complex sync logic (handling updates, resolving conflicts, mapping genres). Manual entry allows us to launch a tightly curated dataset faster and ensures we only have high-quality, verified data on launch.
- **Trade-off:** Content population will be slow and tedious initially.

## DECISION 004: Ad-Light Initial Launch
- **Decision:** The initial design will reserve space for display ads but will not prioritize aggressive ad injections (like pop-ups or full-page takeovers).
- **Reasoning:** We need to establish high Core Web Vitals scores with Google early on. Aggressive ads will ruin our LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) metrics, harming our long-term SEO strategy.
- **Trade-off:** Lower immediate revenue potential per visitor in the early days.

## DECISION 005: Embed Facades for Performance
- **Decision:** YouTube iframes will not load on page load. Instead, a lightweight thumbnail image with a "Play" button will render. Clicking it will swap the image for the actual iframe and auto-play the video.
- **Reasoning:** A single YouTube embed downloads ~500kb of JavaScript and delays the page load. Facades solve this entirely.
- **Trade-off:** Requires custom frontend component logic rather than just pasting a raw `<iframe>` tag.
