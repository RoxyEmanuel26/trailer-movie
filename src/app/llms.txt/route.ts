import { STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';
import { absoluteUrl, siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export async function GET() {
  const streamingLinks = STREAMING_CATALOG.slice(0, 12)
    .map((item) => `- [${item.label} Movies](${absoluteUrl(`/streaming/${item.slug}`)}): ${item.tagline}`)
    .join('\n');

  const popularLinks = POPULAR_CATALOG.map(
    (item) => `- [${item.label}](${absoluteUrl(`/popular/${item.slug}`)}): ${item.description}`
  ).join('\n');

  const originLinks = ORIGIN_CATALOG.slice(0, 10)
    .map(
      (item) =>
        `- [${item.label} Movies](${absoluteUrl(`/origin/${item.slug}`)}): Movies produced in or spoken in ${item.label}.`
    )
    .join('\n');

  const content = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} (${siteConfig.url}) is an independent movie discovery catalog featuring over 79,000 quality-verified films. Every published movie page brings together its official trailer, story synopsis, release date, runtime, age classification, genres, production countries, spoken languages, cast and crew filmographies, audience ratings, and regional streaming, rental, and purchase availability.

## Core Discovery Hubs

- [Home](${siteConfig.url}): Featured trailers, trending discoveries, and curated movie rows.
- [All Movies](${absoluteUrl('/movies')}): Complete chronologically ordered catalog of published films.
- [Streaming Platforms](${absoluteUrl('/streaming')}): Browse movies by streaming, rental, or free-with-ads service.
- [Popular & Top Rated](${absoluteUrl('/popular')}): Audience popularity leaders, Bayesian-weighted top-rated films, and latest releases.
- [Genres](${absoluteUrl('/genres')}): Curated genre catalogs including Action, Science Fiction, Drama, Horror, Thriller, Animation, and Comedy.
- [Countries & Languages](${absoluteUrl('/countries')}): Global cinema organized by production country and spoken language.
- [Release Years](${absoluteUrl('/years')}): Year-by-year film archives from classic cinema to current releases.

## Streaming Platform Guides

${streamingLinks}

## Rankings & Release Feeds

${popularLinks}
- [RSS Feed](${absoluteUrl('/feed.xml')}): Latest quality-verified movies and trailers added to ${siteConfig.name}.
- [XML Sitemap Index](${absoluteUrl('/sitemap.xml')}): Complete sharded index of core pages, movie pages, and cast/crew profiles.

## Global Cinema Hubs

${originLinks}

## Canonical URL Conventions & Citation Guide

- Movie detail & trailer pages: \`${siteConfig.url}/watch/{movie-slug}\` (includes official trailer, synopsis, runtime, age rating, director, top cast, and regional streaming options).
- Cast & crew filmography pages: \`${siteConfig.url}/person/{person-slug}\` (includes biography, personal details, and published catalog filmography).
- Genre pages: \`${siteConfig.url}/genre/{genre-slug}\`
- Streaming platform pages: \`${siteConfig.url}/streaming/{platform-slug}\`
- Release year pages: \`${siteConfig.url}/year/{yyyy}\`
- Country & language pages: \`${siteConfig.url}/origin/{origin-slug}\`

## Methodology & Trust

- [About ${siteConfig.name}](${absoluteUrl('/about')}): Editorial purpose, independence, and data attribution (TMDB & JustWatch).
- [Catalog & Rating Methodology](${absoluteUrl('/methodology')}): Publication quality gates (requiring released status, synopsis, poster, genre, and active trailer) and Bayesian top-rated ranking formula (minimum 50 votes).
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
