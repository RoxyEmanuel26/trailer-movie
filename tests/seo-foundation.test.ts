import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStrictPage, pagePath, isPageOutOfRange } from '../src/lib/pagination';
import { serializeJsonLd } from '../src/components/seo/JsonLd';
import { serializeSitemap, serializeSitemapIndex } from '../src/lib/sitemap-xml';
import { getTmdbImageUrl } from '../src/lib/tmdb-image-loader';
import { moviePath } from '../src/lib/public-routes';
import { canonicalUrl, isValidContactEmail, siteConfig, validateProductionSeoConfig } from '../src/lib/site-config';
import { escapeCdata, SeoService } from '../src/lib/services/SeoService';
import { catalogMetadataCanonical, paginatedMetadataTitle, socialImage } from '../src/lib/seo-metadata';
import { trailerSchema } from '../src/lib/trailer-schema';
import { PersonRepository } from '../src/lib/repositories/PersonRepository';
import { providerRegion, providerRegionCodes } from '../src/lib/provider-region';
import { catalogStatsQuery } from '../src/lib/catalog-stats-query';
import { buildFaqJsonLd, buildMovieQuickFactsAndFaq, extractUniqueProviders } from '../src/lib/movie-aeo';
import { getStreamingCatalogItem, STREAMING_CATALOG } from '../src/lib/streaming-catalog';
import { buildIndexNowPayload } from '../src/lib/indexnow';
import robots from '../src/app/robots';

test('strict pagination accepts only positive integer pages', () => {
  assert.equal(parseStrictPage(undefined), 1);
  assert.equal(parseStrictPage('2'), 2);
  assert.equal(parseStrictPage('2foo'), null);
  assert.equal(parseStrictPage('0'), null);
  assert.equal(parseStrictPage('-1'), null);
  assert.equal(pagePath('/movies', 1), '/movies');
  assert.equal(pagePath('/movies', 3), '/movies?page=3');
  assert.equal(isPageOutOfRange(3, 48, 24), true);
});

test('JSON-LD serializer escapes HTML and JavaScript separators', () => {
  const serialized = serializeJsonLd({ description: '</script>\u2028next' });
  assert.equal(serialized.includes('</script>'), false);
  assert.equal(serialized.includes('\\u003c/script>'), true);
  assert.equal(serialized.includes('\\u2028'), true);
});

test('sitemap serializer emits escaped image and video extensions', () => {
  const xml = serializeSitemap([{
    url: 'https://www.movieflix.site/watch/a&b',
    image: { loc: 'https://image.tmdb.org/t/p/w500/poster.jpg', title: 'A & B poster' },
    video: {
      thumbnailLoc: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      title: 'A & B trailer',
      description: 'Trailer description',
      playerLoc: 'https://www.youtube.com/embed/abc',
      publicationDate: '2026-01-01T00:00:00.000Z',
    },
  }]);
  assert.match(xml, /xmlns:image=/);
  assert.match(xml, /xmlns:video=/);
  assert.match(xml, /a&amp;b/);
  assert.match(xml, /video:publication_date/);
});

test('TMDB image helper replaces original assets with bounded widths', () => {
  assert.equal(
    getTmdbImageUrl('https://image.tmdb.org/t/p/original/file.jpg', 342),
    'https://image.tmdb.org/t/p/w342/file.jpg'
  );
});

test('movie paths use a readable fallback when transliteration is empty', () => {
  assert.equal(moviePath('-1599383'), '/watch/movie-1599383');
  assert.equal(moviePath('f1-911430'), '/watch/f1-911430');
});

test('canonical URLs cannot be overridden by another host', () => {
  assert.equal(canonicalUrl('https://spam.example/movies', '/movies'), 'http://localhost:3000/movies');
  assert.equal(canonicalUrl('/movies?page=2', '/movies'), 'http://localhost:3000/movies?page=2');
});

test('pagination preserves its self canonical and page title despite CMS overrides', () => {
  assert.equal(catalogMetadataCanonical('/movies', '/movies?page=3'), `${siteConfig.url}/movies?page=3`);
  assert.equal(paginatedMetadataTitle('Horror movies', '/genre/horror?page=3'), 'Horror movies — Page 3');
  assert.equal(paginatedMetadataTitle('Horror movies — Page 3', '/genre/horror?page=3'), 'Horror movies — Page 3');
  assert.equal(paginatedMetadataTitle('Horror movies', '/genre/horror'), 'Horror movies');
});

test('social artwork is bounded and does not claim a fictitious crop', () => {
  assert.deepEqual(socialImage('https://image.tmdb.org/t/p/original/a.jpg', 'A'), { url: 'https://image.tmdb.org/t/p/w1280/a.jpg', alt: 'A' });
  assert.equal(socialImage(undefined, 'MovieFlix').width, 1200);
});

test('production canonical rejects credentials, ports, paths and query strings', () => {
  for (const url of ['https://user:password@www.movieflix.site', 'https://www.movieflix.site:444', 'https://www.movieflix.site/movies', 'https://www.movieflix.site?preview=true', 'https://www.movieflix.site#preview']) {
    assert.ok(validateProductionSeoConfig({ url, indexingEnabled: false }));
  }
  assert.equal(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: false }), null);
  assert.equal(canonicalUrl('http://user:password@localhost:3000/watch/a', '/movies'), `${siteConfig.url}/movies`);
});

test('public brand identity is locked to MovieFlix', () => {
  assert.equal(siteConfig.name, 'MovieFlix');
  assert.match(siteConfig.description, /MovieFlix/);
});

test('indexing requires verification and a real contact email', () => {
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true }) || '', /GOOGLE_SITE_VERIFICATION/);
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token' }) || '', /CONTACT_EMAIL/);
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token', contactEmail: 'editor@movieflix.site' }) || '', /ANALYTICS_HMAC_SECRET/);
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token', contactEmail: 'editor@movieflix.site', analyticsHmacSecret: 'a'.repeat(32) }) || '', /REVALIDATION_SECRET/);
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token', contactEmail: 'editor@movieflix.site', analyticsHmacSecret: 'a'.repeat(32), revalidationSecret: 'b'.repeat(32) }) || '', /BETTER_AUTH_SECRET/);
  assert.equal(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token', contactEmail: 'editor@movieflix.site', analyticsHmacSecret: 'a'.repeat(32), revalidationSecret: 'b'.repeat(32), betterAuthSecret: 'c'.repeat(32), betterAuthUrl: 'https://www.movieflix.site' }), null);
  assert.equal(isValidContactEmail('not-an-email'), false);
});

test('RSS CDATA content cannot terminate its wrapper', () => {
  assert.equal(escapeCdata('before]]>after'), 'before]]]]><![CDATA[>after');
});

test('imported catalog scores do not claim MovieFlix review rich results', () => {
  const movie = SeoService.generateStructuredData('Movie', { path: '/watch/test-1', title: 'Test', voteAverage: 8, voteCount: 500 });
  assert.equal(movie.aggregateRating, undefined);
  assert.equal(movie.review, undefined);
});

test('trailer schema never invents an upload date from the movie release', () => {
  const video = { videoId: 'abcdefghijk', title: 'Test trailer', description: 'Test' };
  assert.equal(trailerSchema(video)?.uploadDate, undefined);
  assert.equal(trailerSchema({ ...video, publishedDate: 'invalid' })?.uploadDate, undefined);
  assert.equal(trailerSchema({ ...video, publishedDate: '2025-09-01T12:00:00Z' })?.uploadDate, '2025-09-01T12:00:00.000Z');
  assert.equal(trailerSchema({ ...video, videoId: 'not-a-valid-video-id' }), undefined);
});

test('person indexability requires at least one published credit even with a biography', () => {
  const person = { headshotUrl: '/headshot.jpg', biography: 'A'.repeat(200), movies: [] };
  assert.equal(PersonRepository.isIndexableProfile(person), false);
  assert.equal(PersonRepository.isIndexableProfile({ ...person, movies: [{ movie: { id: 'published-1' } }] }), true);
});

test('viewing availability selects one explicit country rather than merging territories', () => {
  const codes = providerRegionCodes([{ countryCode: 'GB' }, { countryCode: 'US' }, { countryCode: 'US' }, { countryCode: null }]);
  assert.deepEqual(codes, ['GB', 'US']);
  assert.equal(providerRegion(codes, 'FR'), 'US');
  assert.equal(providerRegion(codes, 'GB'), 'GB');
  assert.equal(providerRegion(['FR', 'GB'], 'US'), 'GB');
  assert.equal(providerRegion([], 'US'), '');
});

test('sitemap serializer deduplicates canonical URLs and rejects oversized shards', () => {
  const url = 'https://www.movieflix.site/watch/example-1';
  assert.equal((serializeSitemap([{ url }, { url }]).match(/<url>/g) || []).length, 1);
  assert.throws(() => serializeSitemap(Array.from({ length: 50_001 }, (_, index) => ({ url: `${url}-${index}` }))), /50,000/);
});

test('catalog statistics use a public index-compatible predicate and parameterized origin OR filters', () => {
  const hostile = "x'; DROP TABLE movies; --";
  const query = catalogStatsQuery({ genreSlug: hostile, countryCodes: ['JP'], languageCodes: ['en'], releaseYear: 2025, search: '100%_free' });
  assert.match(query.sql, /"status" = 'PUBLISHED' AND m\."deletedAt" IS NULL/);
  assert.ok(query.sql.includes(' OR EXISTS'));
  assert.equal(query.sql.includes(hostile), false);
  assert.ok(query.values.includes(hostile));
  assert.ok(query.values.includes('JP'));
  assert.ok(query.values.includes('en'));
  assert.ok(query.values.some((value) => value instanceof Date && value.toISOString() === '2026-01-01T00:00:00.000Z'));
  assert.ok(query.values.includes('%100\\%\\_free%'));
});

test('runtime siteConfig and robots() reflect live process.env without rebuilds', () => {
  const envRecord = process.env as Record<string, string | undefined>;
  const prevNodeEnv = envRecord.NODE_ENV;
  const prevIndexing = envRecord.SEO_INDEXING_ENABLED;
  const prevUrl = envRecord.NEXT_PUBLIC_APP_URL;
  const prevVerify = envRecord.GOOGLE_SITE_VERIFICATION;
  try {
    envRecord.NODE_ENV = 'production';
    envRecord.NEXT_PUBLIC_APP_URL = 'https://www.movieflix.site';
    envRecord.GOOGLE_SITE_VERIFICATION = 'gsc-live-token';
    envRecord.SEO_INDEXING_ENABLED = 'false';
    assert.equal(siteConfig.indexingEnabled, false);
    assert.equal(siteConfig.googleVerification, 'gsc-live-token');
    const blocked = robots();
    assert.deepEqual(blocked.rules, { userAgent: '*', disallow: '/' });

    envRecord.SEO_INDEXING_ENABLED = 'true';
    assert.equal(siteConfig.indexingEnabled, true);
    const live = robots();
    assert.ok(Array.isArray(live.rules));
    assert.equal(live.sitemap, 'https://www.movieflix.site/sitemap.xml');
    const wildcard = live.rules.find((r) => r.userAgent === '*');
    assert.ok(Array.isArray(wildcard?.disallow) && wildcard.disallow.includes('/search'));
    const aiAllow = live.rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes('OAI-SearchBot'));
    assert.ok(aiAllow);
    const scraperBlock = live.rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes('Bytespider'));
    assert.equal(scraperBlock?.disallow, '/');
  } finally {
    if (prevNodeEnv === undefined) delete envRecord.NODE_ENV;
    else envRecord.NODE_ENV = prevNodeEnv;
    if (prevIndexing === undefined) delete envRecord.SEO_INDEXING_ENABLED;
    else envRecord.SEO_INDEXING_ENABLED = prevIndexing;
    if (prevUrl === undefined) delete envRecord.NEXT_PUBLIC_APP_URL;
    else envRecord.NEXT_PUBLIC_APP_URL = prevUrl;
    if (prevVerify === undefined) delete envRecord.GOOGLE_SITE_VERIFICATION;
    else envRecord.GOOGLE_SITE_VERIFICATION = prevVerify;
  }
});

test('sitemap index serializer includes optional lastmod for changed shards only', () => {
  const xml = serializeSitemapIndex([
    { url: 'https://www.movieflix.site/sitemaps/core', lastModified: '2026-10-31T00:00:00.000Z' },
    { url: 'https://www.movieflix.site/sitemaps/movies-0' },
  ]);
  assert.match(xml, /<loc>https:\/\/www\.movieflix\.site\/sitemaps\/core<\/loc><lastmod>2026-10-31T00:00:00\.000Z<\/lastmod>/);
  assert.match(xml, /<sitemap><loc>https:\/\/www\.movieflix\.site\/sitemaps\/movies-0<\/loc><\/sitemap>/);
});

test('dynamic per-movie opengraph-image route advertises 1200x630 social card metadata', () => {
  const card = socialImage('/watch/f1-911430/opengraph-image', 'F1');
  assert.deepEqual(card, {
    url: `${siteConfig.url}/watch/f1-911430/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'F1',
  });
});

test('movie AEO quick summary and FAQ use real metadata without inventing ratings or upload dates', () => {
  const providers = extractUniqueProviders([
    { provider: { name: 'Netflix' } },
    { provider: { name: 'Netflix Standard with Ads' } },
    { provider: { name: 'Amazon Prime Video' } },
  ]);
  assert.deepEqual(providers.names, ['Netflix', 'Prime Video']);
  assert.deepEqual(providers.hubLinks, [
    { name: 'Netflix', slug: 'netflix' },
    { name: 'Prime Video', slug: 'prime-video' },
  ]);

  const { quickSummary, faqs } = buildMovieQuickFactsAndFaq({
    title: 'Dune: Part Two',
    year: 2024,
    releaseDate: new Date('2024-03-01T00:00:00.000Z'),
    runtimeMinutes: 166,
    ageRating: 'PG-13',
    mpaaRating: 'PG-13',
    voteAverage: 8.4,
    voteCount: 6200,
    genres: ['Science Fiction', 'Adventure'],
    directors: ['Denis Villeneuve'],
    cast: [{ name: 'Timothée Chalamet', characterName: 'Paul Atreides' }],
    countries: ['United States'],
    languages: ['English'],
    hasActiveTrailer: true,
    providerNames: providers.names,
  });

  assert.match(quickSummary, /Dune: Part Two \(2024\)/);
  assert.match(quickSummary, /Denis Villeneuve/);
  assert.match(quickSummary, /Netflix, Prime Video/);
  assert.equal(faqs.length, 4);
  const faqLd = buildFaqJsonLd('https://www.movieflix.site/watch/dune-part-two-693134', faqs);
  assert.equal(faqLd?.['@type'], 'FAQPage');
  assert.equal(faqLd?.mainEntity.length, 4);
});

test('streaming catalog maps curated slugs and parameterizes providerTmdbIds in stats SQL', () => {
  assert.ok(STREAMING_CATALOG.length >= 15);
  assert.deepEqual(getStreamingCatalogItem('netflix')?.tmdbIds, [8, 175, 1796]);
  const query = catalogStatsQuery({ providerTmdbIds: [8, 175] });
  assert.match(query.sql, /"movie_watch_provider_links"/);
  assert.match(query.sql, /wp\."tmdbId" IN \(\?,\?\)/);
  assert.deepEqual(query.values, [8, 175]);
});

test('IndexNow payload deduplicates same-host canonical URLs and ignores disabled indexing', () => {
  assert.equal(
    buildIndexNowPayload(['/watch/a-1'], {
      siteUrl: 'https://www.movieflix.site',
      key: 'a'.repeat(32),
      indexingEnabled: false,
    }),
    null,
  );
  const payload = buildIndexNowPayload(
    ['/watch/a-1', 'https://www.movieflix.site/watch/a-1', 'https://evil.example/watch/b-2'],
    {
      siteUrl: 'https://www.movieflix.site',
      key: 'a'.repeat(32),
      indexingEnabled: true,
    },
  );
  assert.deepEqual(payload, {
    host: 'www.movieflix.site',
    key: 'a'.repeat(32),
    keyLocation: 'https://www.movieflix.site/indexnow-key.txt',
    urlList: ['https://www.movieflix.site/watch/a-1'],
  });
});
