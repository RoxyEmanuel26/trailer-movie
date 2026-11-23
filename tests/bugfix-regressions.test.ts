import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MovieStatus } from '@prisma/client';
import {
  analyticsEventSchema,
  isAllowedAnalyticsOrigin,
  sanitizeAnalyticsSearchQuery,
} from '../src/lib/analytics/validation';
import { clearAllPublicMemoryCaches, createMemoryCache } from '../src/lib/memory-cache';
import { sanitizeHtml, sanitizeRichText } from '../src/lib/security/sanitize';
import { hasRolePermission } from '../src/lib/auth/permissions';
import { CollectionInputSchema, MovieAdminUpdateSchema, SeoUpdateSchema } from '../src/lib/api/schemas';
import { catalogStatsQuery } from '../src/lib/catalog-stats-query';
import { extractUniqueProviders, buildMovieQuickFactsAndFaq } from '../src/lib/movie-aeo';
import { ORIGIN_CATALOG } from '../src/lib/public-catalog';
import { STREAMING_CATALOG, matchStreamingCatalogSlug } from '../src/lib/streaming-catalog';
import { getOriginAdjective } from '../src/lib/programmatic-guides';
import { buildWatchMetaTitle } from '../src/lib/seo-metadata';
import { formatReleaseCountdown, isUpcomingReleaseDate, parseUpcomingRegion } from '../src/lib/upcoming-guides';
import { TonightRoomStore, computeRoomMatches, normalizeRoomCode, type TonightMovieCard } from '../src/lib/tonight';
import { buildSharedWatchlistPath, parseSharedWatchlistIds } from '../src/lib/watchlist';
import { STUDIO_CATALOG, buildStudioFaqs, getStudioBySlug, matchMovieStudios } from '../src/lib/studio-catalog';
import { THEME_CATALOG, buildThemeFaqs, getThemeBySlug, matchMovieThemes } from '../src/lib/theme-catalog';
import { buildMovieEmbedSnippet } from '../src/lib/embed-snippet';
import { isAllowedRevalidationPath } from '../src/lib/revalidation';
import { SITEMAP_SNAPSHOT_VERSION } from '../src/lib/sitemap-cache';
import { pruneStaleSitemapSnapshots } from '../src/lib/sitemap-cache-prune';
import { serializeSitemap, sitemapUnavailableResponse } from '../src/lib/sitemap-xml';
import { buildFranchiseWatchGuide, cleanFranchiseName, formatMarathonRuntime } from '../src/lib/franchise-guides';
import {
  analyzeMovieSimilarity,
  buildMoviesLikeGuideContent,
  isEligibleForMoviesLikeIndex,
} from '../src/lib/movies-like';
import { RUNTIME_GUIDES } from '../src/lib/runtime-guides';
import { mapTmdbMovieToPrisma, mapTmdbStatus } from '../src/lib/tmdb/mapping';
import { safeUpsertFranchiseCollection } from '../src/lib/services/import-service';

test('analytics validation allows production canonical origin behind 0.0.0.0:5060 and blocks foreign origins', () => {
  const prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://www.movieflix.site';
  try {
    assert.equal(
      isAllowedAnalyticsOrigin('https://www.movieflix.site', 'http://0.0.0.0:5060', 'production'),
      true,
    );
    assert.equal(
      isAllowedAnalyticsOrigin('https://evil.example', 'http://0.0.0.0:5060', 'production'),
      false,
    );
    assert.equal(isAllowedAnalyticsOrigin(null, 'http://0.0.0.0:5060', 'production'), true);
  } finally {
    if (prevAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
  }
});

test('analytics event schema blocks internal events and SQL-cast poisoning payloads', () => {
  assert.equal(
    analyticsEventSchema.safeParse({ eventName: 'system_error', metadata: { message: 'forged' } }).success,
    false,
  );
  assert.equal(
    analyticsEventSchema.safeParse({ eventName: 'security_alert', metadata: { reason: 'forged' } }).success,
    false,
  );
  assert.equal(
    analyticsEventSchema.safeParse({
      eventName: 'web_vital',
      metadata: { name: 'LCP', value: 'not-a-number' },
    }).success,
    false,
  );
  assert.equal(
    analyticsEventSchema.safeParse({
      eventName: 'search',
      metadata: { query: 'dune', resultsCount: 'abc' },
    }).success,
    false,
  );
  assert.equal(
    analyticsEventSchema.safeParse({
      eventName: 'web_vital',
      metadata: { name: 'LCP', value: 1842.5, rating: 'good' },
    }).success,
    true,
  );
  assert.equal(
    analyticsEventSchema.safeParse({
      eventName: 'search',
      metadata: { query: 'The Hunger Games', resultsCount: 5 },
    }).success,
    true,
  );
  assert.equal(
    sanitizeAnalyticsSearchQuery('contact user@example.com or +1 555-123-4567'),
    'contact [redacted-email] or [redacted-phone]',
  );
});

test('memory cache ignores stale in-flight loader that resolves after clearAllPublicMemoryCaches', async () => {
  const cache = createMemoryCache<string>({ maxEntries: 10, ttlMs: 60_000 });
  let releaseFirst!: (value: string) => void;
  const firstPromise = cache.getOrLoad(
    'movie:1',
    () =>
      new Promise<string>((resolve) => {
        releaseFirst = resolve;
      }),
  );

  // Admin mutation clears all public memory caches while request 1 is still in flight
  clearAllPublicMemoryCaches();

  // Resolve the stale in-flight loader
  releaseFirst('stale-value');
  assert.equal(await firstPromise, 'stale-value');

  // Cache MUST NOT have been poisoned by the stale resolution
  assert.equal(cache.get('movie:1'), undefined);

  // Next load should execute fresh loader
  const fresh = await cache.getOrLoad('movie:1', async () => 'fresh-value');
  assert.equal(fresh, 'fresh-value');
  assert.equal(cache.get('movie:1'), 'fresh-value');
});

test('sanitizeRichText & sanitizeHtml defeat nested-tag and unclosed-tag XSS bypasses', () => {
  const nested = '<scr<script>ipt>alert(1)</scr</script>ipt>';
  assert.equal(/<script/i.test(sanitizeRichText(nested)), false);
  assert.equal(/<script/i.test(sanitizeHtml(nested)), false);

  const unclosed = '<img src=x onerror=alert(1)';
  assert.equal(/<img/i.test(sanitizeRichText(unclosed)), false);

  const safeHtml = '<p><strong>Hello</strong> <a href="https://example.com" onclick="alert(1)">world</a></p>';
  const cleaned = sanitizeRichText(safeHtml);
  assert.equal(cleaned.includes('<strong>Hello</strong>'), true);
  assert.equal(cleaned.includes('href="https://example.com"'), true);
  assert.equal(cleaned.includes('onclick'), false);

  const jsHref = '<a href="javascript:alert(1)">bad</a>';
  assert.equal(sanitizeRichText(jsHref).includes('javascript:'), false);

  // 7-layer deeply nested script payload must still be completely stripped
  let deepNested = 'alert(1)';
  for (let i = 0; i < 8; i++) {
    deepNested = `<scr<script>ipt>${deepNested}</scr</script >ipt>`;
  }
  assert.equal(/<script/i.test(sanitizeRichText(deepNested)), false);
  assert.equal(/<script/i.test(sanitizeHtml(deepNested)), false);

  // WHATWG protocol-relative /\ bypass must be rejected
  assert.equal(sanitizeRichText('<a href="/\\evil.example/x">x</a>').includes('evil.example'), false);

  // target="_blank" must automatically enforce rel="noopener noreferrer"
  const blankLink = sanitizeRichText('<a href="https://example.com" target="_blank">open</a>');
  assert.match(blankLink, /rel="[^"]*noopener[^"]*"/);
  assert.match(blankLink, /rel="[^"]*noreferrer[^"]*"/);
});

test('hasRolePermission grants full access to built-in Admin and enforces one-way write:* alias', () => {
  const adminRole = { name: 'Admin', permissions: [] };
  assert.equal(hasRolePermission(adminRole, 'read:analytics'), true);
  assert.equal(hasRolePermission(adminRole, 'write:homepage'), true);

  const editorRole = {
    name: 'Editor',
    permissions: [
      { permission: { action: 'read:movies' } },
      { permission: { action: 'write:movies' } },
    ],
  };
  assert.equal(hasRolePermission(editorRole, 'read:movies'), true);
  assert.equal(hasRolePermission(editorRole, 'write:movies'), true);
  assert.equal(hasRolePermission(editorRole, 'create:movies'), true);
  assert.equal(hasRolePermission(editorRole, 'update:movies'), true);
  assert.equal(hasRolePermission(editorRole, 'delete:movies'), true);
  assert.equal(hasRolePermission(editorRole, 'write:homepage'), false);
  assert.equal(hasRolePermission(editorRole, 'read:analytics'), false);

  // Narrow create:* permission must NEVER elevate to write:* or delete:*
  const creatorOnlyRole = {
    name: 'CollectionCreator',
    permissions: [{ permission: { action: 'create:collections' } }],
  };
  assert.equal(hasRolePermission(creatorOnlyRole, 'create:collections'), true);
  assert.equal(hasRolePermission(creatorOnlyRole, 'write:collections'), false);
  assert.equal(hasRolePermission(creatorOnlyRole, 'update:collections'), false);
  assert.equal(hasRolePermission(creatorOnlyRole, 'delete:collections'), false);
});

test('Zod v4 URL schemas reject javascript:/data: URLs and MovieAdminUpdateSchema validates YouTube IDs', () => {
  assert.equal(
    CollectionInputSchema.safeParse({ title: 'Test', coverImageUrl: 'javascript:alert(1)' }).success,
    false,
  );
  assert.equal(
    SeoUpdateSchema.safeParse({ canonicalUrl: 'data:text/html,<script>alert(1)</script>' }).success,
    false,
  );
  assert.equal(
    CollectionInputSchema.safeParse({ title: 'Test', coverImageUrl: 'https://example.com/cover.jpg' }).success,
    true,
  );
  const emptyUrl = SeoUpdateSchema.safeParse({ canonicalUrl: '   ' });
  assert.equal(emptyUrl.success, true);
  if (emptyUrl.success) assert.equal(emptyUrl.data.canonicalUrl, null);

  const validUrlTrailer = MovieAdminUpdateSchema.safeParse({
    youtubeTrailerId: 'https://youtu.be/dQw4w9WgXcQ?t=10',
  });
  assert.equal(validUrlTrailer.success, true);
  if (validUrlTrailer.success) assert.equal(validUrlTrailer.data.youtubeTrailerId, 'dQw4w9WgXcQ');

  assert.equal(
    MovieAdminUpdateSchema.safeParse({ youtubeTrailerId: 'javascript:alert(1)' }).success,
    false,
  );
  const clearedTrailer = MovieAdminUpdateSchema.safeParse({ youtubeTrailerId: '' });
  assert.equal(clearedTrailer.success, true);
  if (clearedTrailer.success) assert.equal(clearedTrailer.data.youtubeTrailerId, null);
});

test('catalogStatsQuery includes voteAverage IS NOT NULL for top-rated partial index & extractUniqueProviders handles corrupted JSON', () => {
  const query = catalogStatsQuery({ minimumVotes: 50 });
  assert.match(query.sql, /"voteAverage" IS NOT NULL AND m\."voteCount" >=/);

  const malformed = extractUniqueProviders(null, { flatrate: 'not-an-array', rent: [null, 42, { provider_name: 'Netflix' }] });
  assert.deepEqual(malformed.names, ['Netflix']);
});

test('standalone packaging includes next.config.ts runtime modules and proxy uses canonical redirectBase', () => {
  const packSrc = readFileSync(path.resolve('scripts/package-standalone.ts'), 'utf8');
  assert.match(packSrc, /'src\/env\.ts'/);
  assert.match(packSrc, /'src\/lib\/site-config\.ts'/);
  assert.match(packSrc, /'src\/lib\/tmdb-image-loader\.ts'/);

  const proxySrc = readFileSync(path.resolve('src/proxy.ts'), 'utf8');
  assert.match(proxySrc, /const redirectBase = process\.env\.NODE_ENV === 'production' \? siteConfig\.url : request\.url/);
  assert.equal(proxySrc.includes('new URL(targetPath, request.url)'), false);
});

test('sitemapUnavailableResponse never sends cacheable s-maxage headers on 503', () => {
  const res = sitemapUnavailableResponse();
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(res.headers.get('CDN-Cache-Control'), 'no-store');
  assert.equal(res.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
});

test('TMDB mapping handles null/missing status and invalid release dates safely', () => {
  assert.equal(mapTmdbStatus(null), MovieStatus.DRAFT);
  assert.equal(mapTmdbStatus(undefined), MovieStatus.DRAFT);
  assert.equal(mapTmdbStatus('Released'), MovieStatus.PUBLISHED);

  const mapped = mapTmdbMovieToPrisma({
    id: 42,
    title: 'Test Film',
    release_date: 'not-a-valid-date',
    status: '',
  } as any);
  assert.equal(mapped.releaseDate, undefined);
  assert.equal(mapped.slug, 'test-film-42');
});

test('safeUpsertFranchiseCollection generates non-empty tmdbId-keyed slug for non-Latin franchises', async () => {
  const createdRows: Array<{ tmdbId: number; title: string; slug: string }> = [];
  const db = {
    collection: {
      findUnique: async ({ where }: { where: { tmdbId?: number; slug?: string } }) =>
        createdRows.find((r) => (where.tmdbId ? r.tmdbId === where.tmdbId : r.slug === where.slug)) || null,
      createMany: async ({ data }: { data: Array<{ tmdbId: number; title: string; slug: string }> }) => {
        createdRows.push(...data);
        return { count: data.length };
      },
      update: async () => null,
    },
  };

  const coll = await safeUpsertFranchiseCollection(db, {
    id: 888123,
    name: '中国唱诗班（系列）',
    poster_path: null,
    backdrop_path: null,
  });
  assert.equal(coll.tmdbId, 888123);
  assert.equal(coll.slug, 'collection-888123');
  assert.notEqual(coll.slug, '');
});

test('[info] route guards against Object.prototype keys and HomepageRepository avoids BigInt serialization', () => {
  const infoSrc = readFileSync(path.resolve('src/app/(public)/[info]/page.tsx'), 'utf8');
  assert.match(infoSrc, /Object\.hasOwn\(pages,\s*info\)/);

  const homepageRepoSrc = readFileSync(path.resolve('src/lib/repositories/HomepageRepository.ts'), 'utf8');
  const getSectionDataIdx = homepageRepoSrc.indexOf('static async getSectionData');
  assert.ok(getSectionDataIdx > 0);
  const getSectionDataSrc = homepageRepoSrc.slice(getSectionDataIdx);
  assert.equal(getSectionDataSrc.includes('include: { genres:'), false);
  assert.match(getSectionDataSrc, /select:\s*homepageMovieSelect/);
  assert.match(homepageRepoSrc, /update:\s*\{\}/);
});

test('disk hygiene: pruneStaleSitemapSnapshots removes old versions/stale temps and runtime caches stay bounded', async () => {
  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'movieflix-disk-hygiene-'));
  try {
    const publicDataDir = path.join(tmpRoot, 'public-data');
    mkdirSync(publicDataDir, { recursive: true });

    const activeXml = path.join(tmpRoot, `${SITEMAP_SNAPSHOT_VERSION}-movies-0.xml`);
    const oldUnprefixedXml = path.join(tmpRoot, 'movies-0.xml');
    const oldVersionXml = path.join(tmpRoot, 'v3-core.xml');
    const staleTmp = path.join(tmpRoot, `${SITEMAP_SNAPSHOT_VERSION}-movies-1.xml.123.tmp`);
    const freshTmp = path.join(tmpRoot, `${SITEMAP_SNAPSHOT_VERSION}-movies-2.xml.123.tmp`);
    const stalePublicTmp = path.join(publicDataDir, 'homepage-v1.json.123.tmp');

    writeFileSync(activeXml, '<urlset />', 'utf8');
    writeFileSync(oldUnprefixedXml, '<urlset />', 'utf8');
    writeFileSync(oldVersionXml, '<urlset />', 'utf8');
    writeFileSync(staleTmp, 'partial', 'utf8');
    writeFileSync(freshTmp, 'writing', 'utf8');
    writeFileSync(stalePublicTmp, 'partial', 'utf8');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    utimesSync(staleTmp, twoHoursAgo, twoHoursAgo);
    utimesSync(stalePublicTmp, twoHoursAgo, twoHoursAgo);

    const result = await pruneStaleSitemapSnapshots(tmpRoot, 30 * 60_000);
    assert.equal(result.removedFiles, 4);
    assert.equal(existsSync(activeXml), true);
    assert.equal(existsSync(freshTmp), true);
    assert.equal(existsSync(oldUnprefixedXml), false);
    assert.equal(existsSync(oldVersionXml), false);
    assert.equal(existsSync(staleTmp), false);
    assert.equal(existsSync(stalePublicTmp), false);
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  const movieServiceSrc = readFileSync(path.resolve('src/lib/services/MovieService.ts'), 'utf8');
  assert.equal(movieServiceSrc.includes('unstable_cache'), false);

  const serverSrc = readFileSync(path.resolve('server.js'), 'utf8');
  assert.match(serverSrc, /scheduleDiskHousekeeping\(\)/);
  assert.match(serverSrc, /MAX_FETCH_CACHE_FILES/);

  const packSrc = readFileSync(path.resolve('scripts/package-standalone.ts'), 'utf8');
  assert.match(packSrc, /install --prod --frozen-lockfile/);
  assert.match(packSrc, /\.movieflix-file-manifest/);
  assert.match(packSrc, /store prune/);
});

test('Phase 1 SEO: multi-image sitemap deduplicates and caps at 6 images per URL', () => {
  const xml = serializeSitemap([
    {
      url: 'https://www.movieflix.site/watch/inception-27205',
      images: [
        { loc: 'https://image.tmdb.org/t/p/w780/poster.jpg', title: 'Inception (2010) Official Movie Poster' },
        { loc: 'https://image.tmdb.org/t/p/w780/poster.jpg', title: 'Duplicate poster should be dropped' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg1.jpg', title: 'Inception (2010) Official HD Wallpaper' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg2.jpg', title: 'Inception (2010) HD Wallpaper & Still 1' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg3.jpg', title: 'Inception (2010) HD Wallpaper & Still 2' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg4.jpg', title: 'Inception (2010) HD Wallpaper & Still 3' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg5.jpg', title: 'Inception (2010) HD Wallpaper & Still 4' },
        { loc: 'https://image.tmdb.org/t/p/w1280/bg6.jpg', title: 'Overflow image beyond cap' },
      ],
    },
  ]);

  const matches = xml.match(/<image:image>/g) || [];
  assert.equal(matches.length, 6);
  assert.equal(xml.includes('Duplicate poster should be dropped'), false);
  assert.equal(xml.includes('Overflow image beyond cap'), false);
  assert.match(xml, /Inception \(2010\) Official HD Wallpaper/);
});

test('Phase 1 SEO: franchise watch guide strips duplicate Collection suffix and computes marathon runtime', () => {
  assert.equal(cleanFranchiseName('The Hunger Games Collection'), 'The Hunger Games');
  assert.equal(cleanFranchiseName('Spider-Man (MCU) Movie Collection'), 'Spider-Man (MCU)');
  assert.equal(formatMarathonRuntime(642), '10h 42m');

  const guide = buildFranchiseWatchGuide({
    title: 'Dune Collection',
    description: null,
    totalMovies: 2,
    movies: [
      {
        id: 'm2',
        title: 'Dune: Part Two',
        slug: 'dune-part-two-693134',
        posterUrl: 'https://image.tmdb.org/t/p/w500/p2.jpg',
        releaseDate: new Date('2024-02-27T00:00:00Z'),
        runtimeMinutes: 166,
        voteAverage: 8.3,
        mpaaRating: 'PG-13',
      },
      {
        id: 'm1',
        title: 'Dune',
        slug: 'dune-438631',
        posterUrl: 'https://image.tmdb.org/t/p/w500/p1.jpg',
        releaseDate: new Date('2021-09-15T00:00:00Z'),
        runtimeMinutes: 155,
        voteAverage: 7.8,
        mpaaRating: 'PG-13',
      },
    ],
  });

  assert.equal(guide.franchiseName, 'Dune');
  assert.equal(guide.heading, 'Dune Movies in Order');
  assert.equal(guide.indexable, true);
  assert.equal(guide.marathonLabel, '5h 21m');
  assert.equal(guide.yearRange, '2021–2024');
  assert.equal(guide.firstMovie?.title, 'Dune');
  assert.equal(guide.highestRatedMovie?.title, 'Dune: Part Two');
  assert.ok(guide.faqs.length >= 3);
  assert.match(guide.faqs[0].answer, /1\. Dune \(2021\), 2\. Dune: Part Two \(2024\)/);
});

test('Phase 1 SEO: movies-like analyzer computes shared themes, runtime deltas, and quality gates', () => {
  assert.equal(
    isEligibleForMoviesLikeIndex({ importQualityStatus: 'READY', voteCount: 150, recommendationCount: 6 }),
    true,
  );
  assert.equal(
    isEligibleForMoviesLikeIndex({ importQualityStatus: 'READY', voteCount: 40, recommendationCount: 10 }),
    false,
  );
  assert.equal(
    isEligibleForMoviesLikeIndex({ importQualityStatus: 'READY', voteCount: 500, recommendationCount: 3 }),
    false,
  );

  const source = {
    id: 'src',
    title: 'Inception',
    slug: 'inception-27205',
    releaseDate: new Date('2010-07-15T00:00:00Z'),
    runtimeMinutes: 148,
    voteAverage: 8.4,
    voteCount: 35000,
    importQualityStatus: 'READY',
    genres: [{ genre: { name: 'Science Fiction', slug: 'science-fiction' } }, { genre: { name: 'Action', slug: 'action' } }],
    keywords: [{ keyword: { name: 'dream' } }, { keyword: { name: 'heist' } }],
    directors: ['Christopher Nolan'],
  };
  const candidate = {
    id: 'cand',
    title: 'Tenet',
    slug: 'tenet-577922',
    posterUrl: 'https://image.tmdb.org/t/p/w500/tenet.jpg',
    releaseDate: new Date('2020-08-22T00:00:00Z'),
    runtimeMinutes: 150,
    mpaaRating: 'PG-13',
    voteAverage: 7.2,
    genres: [{ genre: { name: 'Science Fiction', slug: 'science-fiction' } }, { genre: { name: 'Action', slug: 'action' } }],
    keywords: [{ keyword: { name: 'heist' } }, { keyword: { name: 'time manipulation' } }],
    directors: ['Christopher Nolan'],
    watchProviderLinks: [{ provider: { name: 'Netflix' } }],
  };

  const analyzed = analyzeMovieSimilarity(source, candidate);
  assert.deepEqual(analyzed.sharedDirectors, ['Christopher Nolan']);
  assert.deepEqual(analyzed.sharedKeywords, ['heist']);
  assert.equal(analyzed.runtimeComparison, 'Similar runtime');
  assert.match(analyzed.reasonText, /Same director \(Christopher Nolan\)/);
  assert.match(analyzed.reasonText, /Shared themes: heist/);

  const content = buildMoviesLikeGuideContent(source, [analyzed]);
  assert.match(content.metaTitle, /Movies Like Inception \(2010\)/);
  assert.ok(content.faqs.length >= 3);
  assert.equal(RUNTIME_GUIDES['under-90-minutes'].minRuntimeMinutes, 60);
  assert.equal(RUNTIME_GUIDES['under-90-minutes'].maxRuntimeMinutes, 90);
});

test('Phase 2 SEO: US, Europe, and Asia catalogs & provider normalizers cover top international markets', () => {
  const originSlugs = new Set(ORIGIN_CATALOG.map((o) => o.slug));
  for (const slug of ['spain-spanish', 'nordic', 'belgium', 'netherlands-dutch', 'ireland', 'poland-polish']) {
    assert.equal(originSlugs.has(slug), true, `Missing European origin slug ${slug}`);
    const origin = ORIGIN_CATALOG.find((o) => o.slug === slug)!;
    assert.ok(getOriginAdjective(origin).length > 2);
  }

  const prime = STREAMING_CATALOG.find((s) => s.slug === 'prime-video');
  assert.ok(prime?.tmdbIds.includes(10), 'prime-video should include Amazon Video (tmdbId 10)');

  for (const slug of ['fandango-at-home', 'sky', 'rakuten-tv', 'canal-plus', 'hoopla', 'mx-player']) {
    assert.ok(
      STREAMING_CATALOG.some((s) => s.slug === slug),
      `Missing international streaming platform ${slug}`,
    );
  }

  assert.equal(matchStreamingCatalogSlug('Sky Store'), 'sky');
  assert.equal(matchStreamingCatalogSlug('Rakuten TV'), 'rakuten-tv');
  assert.equal(matchStreamingCatalogSlug('Fandango At Home'), 'fandango-at-home');
  assert.equal(matchStreamingCatalogSlug('Canal VOD'), 'canal-plus');
  assert.equal(matchStreamingCatalogSlug('Amazon MX Player'), 'mx-player');
  assert.equal(matchStreamingCatalogSlug('Hoopla'), 'hoopla');
});

test('Phase 2 SEO: upcoming countdown, watch SERP title, and upcoming FAQ work accurately', () => {
  const now = new Date('2026-11-23T00:00:00.000Z');
  const futureDate = new Date('2026-12-18T00:00:00.000Z');
  assert.equal(isUpcomingReleaseDate(futureDate, now), true);
  assert.equal(isUpcomingReleaseDate(new Date('2025-01-01T00:00:00.000Z'), now), false);
  assert.match(formatReleaseCountdown(futureDate, now) || '', /In \d+ weeks/);
  assert.equal(parseUpcomingRegion('europe'), 'europe');
  assert.equal(parseUpcomingRegion('invalid'), 'all');

  assert.equal(
    buildWatchMetaTitle('Avengers: Doomsday', 2026, { isUpcoming: true }),
    'Avengers: Doomsday (2026) Official Trailer, Release Date & Cast',
  );
  assert.equal(
    buildWatchMetaTitle('Inception', 2010, { isUpcoming: false }),
    'Inception (2010) Trailer, Cast & Where to Watch',
  );

  const aeo = buildMovieQuickFactsAndFaq({
    title: 'Dune: Part Three',
    year: 2026,
    releaseDate: new Date(Date.now() + 30 * 86_400_000),
    runtimeMinutes: null,
    ageRating: null,
    mpaaRating: null,
    voteAverage: null,
    voteCount: null,
    genres: ['Science Fiction', 'Adventure'],
    directors: ['Denis Villeneuve'],
    cast: [{ name: 'Timothée Chalamet', characterName: 'Paul Atreides' }],
    countries: ['United States'],
    languages: ['English'],
    hasActiveTrailer: true,
    providerNames: [],
  });
  assert.ok(
    aeo.faqs.some((f) => /When does Dune: Part Three come out in theaters/i.test(f.question)),
    'Expected upcoming release-date FAQ',
  );
});

test('Phase 2 Viral Tools: TonightRoomStore matches mutual host/guest likes and Watchlist sanitizes shared IDs', async () => {
  const sampleDeck: TonightMovieCard[] = [
    {
      id: 'm-1',
      tmdbId: 27205,
      title: 'Inception',
      slug: 'inception-27205',
      synopsis: 'A thief steals corporate secrets through dream-sharing.',
      posterUrl: '/poster1.jpg',
      backdropUrl: '/bg1.jpg',
      releaseYear: 2010,
      runtimeMinutes: 148,
      voteAverage: 8.4,
      youtubeTrailerId: 'YoHD9XEInc0',
      genres: ['Science Fiction'],
      providers: ['Netflix'],
    },
    {
      id: 'm-2',
      tmdbId: 157336,
      title: 'Interstellar',
      slug: 'interstellar-157336',
      synopsis: 'Explorers travel through a wormhole in space.',
      posterUrl: '/poster2.jpg',
      backdropUrl: '/bg2.jpg',
      releaseYear: 2014,
      runtimeMinutes: 169,
      voteAverage: 8.5,
      youtubeTrailerId: 'zSWdZVtXT7E',
      genres: ['Science Fiction'],
      providers: ['Prime Video'],
    },
  ];

  const room = await TonightRoomStore.create(sampleDeck);
  assert.ok(normalizeRoomCode(room.code) === room.code);
  assert.equal(normalizeRoomCode('bad'), null);

  await TonightRoomStore.recordSwipe({ code: room.code, role: 'host', movieId: 'm-1', decision: 'like' });
  await TonightRoomStore.recordSwipe({ code: room.code, role: 'guest', movieId: 'm-1', decision: 'pass' });
  await TonightRoomStore.recordSwipe({ code: room.code, role: 'guest', movieId: 'm-2', decision: 'like' });
  const afterMatch = await TonightRoomStore.recordSwipe({
    code: room.code,
    role: 'host',
    movieId: 'm-2',
    decision: 'like',
  });

  assert.ok(afterMatch);
  assert.equal(afterMatch.room.guestJoined, true);
  assert.deepEqual(
    afterMatch.matches.map((m) => m.id),
    ['m-2'],
  );
  assert.deepEqual(
    computeRoomMatches(afterMatch.room).map((m) => m.title),
    ['Interstellar'],
  );

  // Watchlist ID parser: deduplicates, rejects non-numeric/XSS tokens, caps at 40
  const parsedIds = parseSharedWatchlistIds('27205, 157336, 27205, <script>, -5, 0, 9999999999, 603');
  assert.deepEqual(parsedIds, [27205, 157336, 603]);
  assert.equal(
    buildSharedWatchlistPath([{ tmdbId: 27205 }, { tmdbId: null }, { tmdbId: 603 }]),
    '/watchlist?ids=27205,603',
  );
});

test('Phase 3 SEO: Global US/Europe/Asia Studio & Theme catalogs match movie relations and generate FAQs', () => {
  assert.ok(STUDIO_CATALOG.length >= 35, 'Expected at least 35 curated global film studios');
  for (const slug of ['a24', 'blumhouse', 'bbc-film', 'studiocanal', 'toho', 'cj-enm', 'toei-animation']) {
    const studio = getStudioBySlug(slug);
    assert.ok(studio, `Missing studio ${slug}`);
    assert.ok(studio.tmdbIds.length >= 1);
    const faqs = buildStudioFaqs({ studio, total: 80, highlights: ['Movie A', 'Movie B'] });
    assert.ok(faqs.length >= 3);
  }

  const matchedStudios = matchMovieStudios([
    { company: { tmdbId: 41077, name: 'A24' } },
    { company: { tmdbId: 99999999, name: 'Random Shell LLC' } },
    { company: { tmdbId: 882, name: 'TOHO' } },
  ]);
  assert.deepEqual(
    matchedStudios.map((s) => s.slug),
    ['a24', 'toho'],
  );

  assert.ok(THEME_CATALOG.length >= 35, 'Expected at least 35 curated themes & tropes');
  for (const slug of ['christmas', 'time-travel', 'based-on-true-story', 'found-footage', 'heist', 'cyberpunk', 'folk-horror']) {
    const theme = getThemeBySlug(slug);
    assert.ok(theme, `Missing theme ${slug}`);
    assert.ok(theme.keywordTmdbIds.length >= 1);
    const faqs = buildThemeFaqs({ theme, total: 250, highlights: ['Inception', 'Interstellar'] });
    assert.ok(faqs.length >= 3);
  }

  const matchedThemes = matchMovieThemes([
    { keyword: { tmdbId: 4379, name: 'time travel' } },
    { keyword: { tmdbId: 12190, name: 'cyberpunk' } },
    { keyword: { tmdbId: 123456789, name: 'unindexed keyword' } },
  ]);
  assert.deepEqual(
    matchedThemes.map((t) => t.slug),
    ['time-travel', 'cyberpunk'],
  );

  // catalogStatsQuery supports companyTmdbIds and keywordTmdbIds parameterized SQL
  const studioSql = catalogStatsQuery({ companyTmdbIds: [41077] });
  assert.match(studioSql.strings.join(' '), /"production_companies"/);
  const themeSql = catalogStatsQuery({ keywordTmdbIds: [4379] });
  assert.match(themeSql.strings.join(' '), /"movie_keywords"/);
});

test('Phase 3 Backlink Engine & Headers: embed snippet escapes HTML attributes and next.config scopes X-Frame-Options', () => {
  const snippet = buildMovieEmbedSnippet({
    siteUrl: 'https://www.movieflix.site/',
    slug: 'inception-27205',
    title: 'Inception "Dream" <script>',
    year: 2010,
  });
  assert.equal(snippet.embedUrl, 'https://www.movieflix.site/embed/watch/inception-27205');
  assert.equal(snippet.watchUrl, 'https://www.movieflix.site/watch/inception-27205');
  assert.equal(snippet.html.includes('<script>'), false);
  assert.match(snippet.html, /&quot;Dream&quot; &lt;script&gt;/);

  assert.equal(isAllowedRevalidationPath('/studio/a24'), true);
  assert.equal(isAllowedRevalidationPath('/theme/time-travel'), true);
  assert.equal(isAllowedRevalidationPath('/upcoming/2026'), true);
  assert.equal(isAllowedRevalidationPath('/movies-like/inception-27205'), true);

  const nextConfigSrc = readFileSync(path.resolve('next.config.ts'), 'utf8');
  assert.match(nextConfigSrc, /\/\(\(\?!embed\/\)\.\*\)/);
  assert.match(nextConfigSrc, /frame-ancestors \*/);
  assert.match(nextConfigSrc, /\/movies-like\/:slug\/opengraph-image/);
  assert.match(nextConfigSrc, /\/collection\/:slug\/opengraph-image/);
  assert.match(nextConfigSrc, /\/person\/:slug\/opengraph-image/);
  assert.match(nextConfigSrc, /\/upcoming\/opengraph-image/);
});
