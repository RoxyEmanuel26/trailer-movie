import { STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';
import { STUDIO_CATALOG } from '@/lib/studio-catalog';
import { THEME_CATALOG } from '@/lib/theme-catalog';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { SeoRepository } from '@/lib/repositories/SeoRepository';
import { MovieService } from '@/lib/services/MovieService';
import { createMemoryCache } from '@/lib/memory-cache';

export const revalidate = 3600;

const llmsMovieCountCache = createMemoryCache<number>({
  maxEntries: 2,
  ttlMs: 60 * 60_000,
});

export async function GET() {
  const [movieCount, facetGuides] = await Promise.all([
    llmsMovieCountCache
      .getOrLoad('indexable-movie-count', () => SeoRepository.countIndexableMovies())
      .catch(() => null),
    MovieService.getIndexableFacetGuides().catch(() => null),
  ]);
  const movieCountLabel =
    typeof movieCount === 'number' && movieCount > 0
      ? movieCount.toLocaleString('en-US')
      : 'over 79,000';
  const latestActionYear = facetGuides?.genreYear
    .filter((entry) => entry.genreSlug === 'action')
    .sort((a, b) => b.year - a.year)[0]?.year;
  const latestHorrorYear = facetGuides?.genreYear
    .filter((entry) => entry.genreSlug === 'horror')
    .sort((a, b) => b.year - a.year)[0]?.year;
  const actionGuideLine = latestActionYear
    ? `- [Best Action Movies of ${latestActionYear}](${absoluteUrl(`/genre/action/${latestActionYear}`)}): New ${latestActionYear} action releases with official trailers and viewing options.`
    : `- [Best Action Movies](${absoluteUrl('/genre/action')}): Action releases with official trailers and viewing options.`;
  const horrorGuideLine = latestHorrorYear
    ? `- [Best Horror Movies of ${latestHorrorYear}](${absoluteUrl(`/genre/horror/${latestHorrorYear}`)}): ${latestHorrorYear} horror films ranked by popularity and release date.`
    : `- [Best Horror Movies](${absoluteUrl('/genre/horror')}): Horror films ranked by popularity and release date.`;

  const streamingLinks = STREAMING_CATALOG.slice(0, 18)
    .map((item) => `- [${item.label} Movies](${absoluteUrl(`/streaming/${item.slug}`)}): ${item.tagline}`)
    .join('\n');

  const popularLinks = POPULAR_CATALOG.map(
    (item) => `- [${item.label}](${absoluteUrl(`/popular/${item.slug}`)}): ${item.description}`
  ).join('\n');

  const originLinks = ORIGIN_CATALOG.slice(0, 18)
    .map(
      (item) =>
        `- [${item.label} Movies](${absoluteUrl(`/origin/${item.slug}`)}): Movies produced in or spoken in ${item.label}.`
    )
    .join('\n');

  const content = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} (${siteConfig.url}) is an independent movie discovery catalog featuring ${movieCountLabel} quality-verified films. Every published movie page brings together its official trailer, story synopsis, release date, runtime, age classification, genres, production countries, spoken languages, cast and crew filmographies, audience ratings, and regional streaming, rental, and purchase availability.

## Core Discovery Hubs

- [Home](${siteConfig.url}): Featured trailers, trending discoveries, and curated movie rows.
- [All Movies](${absoluteUrl('/movies')}): Complete chronologically ordered catalog of published films.
- [Upcoming Movies & Official Trailers](${absoluteUrl('/upcoming')}): Verified upcoming theatrical releases across the US, Europe, and Asia with official YouTube trailers and countdowns.
- [What to Watch Tonight Picker](${absoluteUrl('/tonight')}): Free interactive solo movie picker and live multiplayer couple/friend trailer swipe matcher.
- [Personal & Shareable Watchlist](${absoluteUrl('/watchlist')}): Zero-login browser watchlist with one-click shareable list links.
- [Movies Under 90 Minutes](${absoluteUrl('/movies/under-90-minutes')}): Feature films between 60 and 90 minutes for quick weeknight watches.
- [Movies Under 2 Hours](${absoluteUrl('/movies/under-2-hours')}): Complete feature films running between 60 and 120 minutes.
- [Movie Franchises & Watch Orders](${absoluteUrl('/collections')}): Chronological franchise watch guides with total marathon runtimes.
- [Global Film Studios](${absoluteUrl('/studios')}): Curated catalogs for ${STUDIO_CATALOG.length} iconic US, European, and Asian production studios including A24, Blumhouse, Pixar, BBC Film, StudioCanal, TOHO, and CJ ENM.
- [Movie Themes & Story Tropes](${absoluteUrl('/themes')}): ${THEME_CATALOG.length} high-intent thematic guides including Time Travel, Based on a True Story, Based on a Book, Found Footage, Heist, Anime, Folk Horror, Cyberpunk, and Christmas Movies.
- [Streaming Platforms](${absoluteUrl('/streaming')}): Browse movies by streaming, rental, or free-with-ads service.
- [Popular & Top Rated](${absoluteUrl('/popular')}): Audience popularity leaders, Bayesian-weighted top-rated films, and latest releases.
- [Genres](${absoluteUrl('/genres')}): Curated genre catalogs including Action, Science Fiction, Drama, Horror, Thriller, Animation, and Comedy.
- [Countries & Languages](${absoluteUrl('/countries')}): Global cinema organized by production country and spoken language.
- [Release Years](${absoluteUrl('/years')}): Year-by-year film archives from classic cinema to current releases.

## Curated Cross-Facet Guides

- [Best Action Movies on Netflix](${absoluteUrl('/streaming/netflix/action')}): Top action films streaming on Netflix with trailers and cast credits.
- [Best Horror Movies on Netflix](${absoluteUrl('/streaming/netflix/horror')}): Horror movies currently listed on Netflix across regions.
${actionGuideLine}
${horrorGuideLine}
- [Best Korean Thriller Movies](${absoluteUrl('/origin/south-korea-korean/thriller')}): South Korean thriller cinema with trailers, cast, and streaming options.
- [Best Japanese Animation Movies](${absoluteUrl('/origin/japan-japanese/animation')}): Japanese anime feature films and theatrical animation.
- [Best Indonesian Horror Movies](${absoluteUrl('/origin/indonesia-indonesian/horror')}): Indonesian horror releases with trailers and regional streaming guides.

## Streaming Platform Guides

${streamingLinks}

## Rankings & Release Feeds

${popularLinks}
- [RSS Feed](${absoluteUrl('/feed.xml')}): Latest quality-verified movies and trailers added to ${siteConfig.name}.
- [XML Sitemap Index](${absoluteUrl('/sitemap.xml')}): Complete sharded index of core pages, cross-facet guides, movie pages, and cast/crew profiles.

## Global Cinema Hubs

${originLinks}

## Canonical URL Conventions & Citation Guide

- Movie detail & trailer pages: \`${siteConfig.url}/watch/{movie-slug}\` (includes official trailer, synopsis, runtime, age rating, director, top cast, and regional streaming options).
- Similar movie comparison guides: \`${siteConfig.url}/movies-like/{movie-slug}\` (curated recommendations with shared themes, runtime deltas, ratings, and streaming platforms).
- Franchise watch order guides: \`${siteConfig.url}/collection/{collection-slug}\` (chronological watch order and total marathon runtime).
- Film studio catalogs: \`${siteConfig.url}/studio/{studio-slug}\` (e.g., \`/studio/a24\`, \`/studio/blumhouse\`, \`/studio/toho\`, \`/studio/studiocanal\`, \`/studio/bbc-film\`, \`/studio/cj-enm\`).
- Thematic & story trope guides: \`${siteConfig.url}/theme/{theme-slug}\` (e.g., \`/theme/time-travel\`, \`/theme/based-on-true-story\`, \`/theme/christmas\`, \`/theme/found-footage\`, \`/theme/heist\`).
- Cast & crew filmography pages: \`${siteConfig.url}/person/{person-slug}\` (includes biography, personal details, and published catalog filmography).
- Genre pages: \`${siteConfig.url}/genre/{genre-slug}\`
- Genre by release year guides: \`${siteConfig.url}/genre/{genre-slug}/{yyyy}\`
- Streaming platform pages: \`${siteConfig.url}/streaming/{platform-slug}\`
- Streaming by genre guides: \`${siteConfig.url}/streaming/{platform-slug}/{genre-slug}\`
- Release year pages: \`${siteConfig.url}/year/{yyyy}\`
- Upcoming theatrical calendar by year: \`${siteConfig.url}/upcoming/{yyyy}\`
- Country & language pages: \`${siteConfig.url}/origin/{origin-slug}\`
- Country & language by genre guides: \`${siteConfig.url}/origin/{origin-slug}/{genre-slug}\`

## Methodology & Trust

- [About ${siteConfig.name}](${absoluteUrl('/about')}): Editorial purpose, independence, and data attribution (TMDB & JustWatch).
- [Catalog & Rating Methodology](${absoluteUrl('/methodology')}): Publication quality gates (requiring released status, synopsis, poster, genre, and active trailer) and Bayesian top-rated ranking formula (minimum 50 votes).
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
