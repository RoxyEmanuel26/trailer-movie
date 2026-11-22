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
import { extractUniqueProviders } from '../src/lib/movie-aeo';
import { SITEMAP_SNAPSHOT_VERSION } from '../src/lib/sitemap-cache';
import { pruneStaleSitemapSnapshots } from '../src/lib/sitemap-cache-prune';
import { sitemapUnavailableResponse } from '../src/lib/sitemap-xml';
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
