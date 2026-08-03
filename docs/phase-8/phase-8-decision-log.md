# Phase 8 Decision Log

This document records the major architectural choices made regarding SEO.

## DECISION 001: Automatic vs. Manual Metadata
- **Decision:** The system will auto-generate all meta titles, descriptions, and schema markup based on the core database fields, but allow an `SEO Editor` to manually override them.
- **Reasoning:** Manual entry for 10,000+ movies is impossible. Auto-generation ensures 100% coverage, while manual overrides allow for surgical optimization on high-value pages.
- **Trade-off:** Auto-generated text can sometimes feel generic, requiring strict quality control on the underlying database fields (like TMDB synopses).

## DECISION 002: Flat URL Structure
- **Decision:** Movies live at `/movie/[slug]`, never `/genre/[slug]/[movie-slug]`.
- **Reasoning:** Movies span multiple genres. Nesting them creates duplicate content issues or messy breadcrumb logic. A flat structure keeps URLs clean, short, and permanent.
- **Trade-off:** We lose the slight semantic benefit of having the genre in the URL path, but we gain immense stability.

## DECISION 003: "Load More" Pagination
- **Decision:** We use a "Load More" button that functions as a standard `<a href="?page=X">` tag for crawlers, but is intercepted by JavaScript for infinite-scroll-style UX for humans.
- **Reasoning:** Googlebot does not click buttons or scroll to trigger JS events. It needs standard `href` links to find deeper content.
- **Trade-off:** Requires slightly more complex frontend hydration logic than standard infinite scroll.

## DECISION 004: Noindexing Search Pages
- **Decision:** All `/search?q=...` routes are strictly `noindex`.
- **Reasoning:** Indexing internal search results creates infinite, uncontrollable URL permutations, leading to massive crawl bloat and potential penalties for thin content.
- **Trade-off:** We cannot rely on users searching for obscure terms to accidentally generate ranking pages. We must intentionally build Collections for long-tail keywords.
