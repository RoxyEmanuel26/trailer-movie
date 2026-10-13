import assert from 'node:assert/strict';

// Read-only checks: no indexing changes, imports, analytics, or CMS writes.
// pnpm exec tsx scripts/seo-preflight.ts http://localhost:3000
const base = new URL(process.argv[2] || 'http://localhost:3000');
const expectedIndexing = process.env.SEO_PREFLIGHT_INDEXING === 'true';
const canonicalBase = 'https://www.movieflix.site';
const headers: Record<string, string> = { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' };
if (process.env.SEO_PREFLIGHT_ORIGIN_TOKEN) headers['x-movieflix-origin-token'] = process.env.SEO_PREFLIGHT_ORIGIN_TOKEN;

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1]?.replace(/&amp;/g, '&');
}

async function check(path: string, status = 200) {
  const start = Date.now();
  const response = await fetch(new URL(path, base), { headers, redirect: 'manual', signal: AbortSignal.timeout(120_000) });
  const text = await response.text();
  assert.equal(response.status, status, `${path}: HTTP status`);
  if (status === 200 && response.headers.get('content-type')?.includes('text/html')) {
    const canonicalTags = [...text.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag).filter((tag) => attribute(tag, 'rel') === 'canonical');
    assert.equal(canonicalTags.length, 1, `${path}: exactly one canonical`);
    assert.ok(attribute(canonicalTags[0], 'href')?.startsWith(canonicalBase), `${path}: production canonical`);
    assert.equal([...text.matchAll(/<h1\b/gi)].length, 1, `${path}: exactly one H1`);
    const robots = [...text.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => tag).filter((tag) => attribute(tag, 'name') === 'robots').map((tag) => attribute(tag, 'content') || '').join(',');
    if (!expectedIndexing || path.startsWith('/search')) assert.match(robots, /noindex/, `${path}: indexability gate`);
    if (path.includes('?page=2')) assert.ok(attribute(canonicalTags[0], 'href')?.endsWith('?page=2'), `${path}: pagination self canonical`);
    for (const [, json] of text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) JSON.parse(json);
    assert.equal(/<iframe\b[^>]*src="https:\/\/www\.youtube\.com\/embed\//i.test(text), false, `${path}: no eager YouTube iframe`);
  }
  if (status === 200 && path.startsWith('/sitemap')) {
    const urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.equal(new Set(urls).size, urls.length, `${path}: unique URLs`);
    for (const url of urls) {
      assert.ok(url.startsWith(`${canonicalBase}/`) || url === canonicalBase, `${path}: canonical host`);
      assert.doesNotMatch(url, /\/(?:watch|person)\/c[a-z0-9]{20,}(?:<|$)/i, `${path}: no internal IDs`);
    }
  }
  console.log(`${status} ${path} (${Date.now() - start}ms)`);
  return text;
}

async function main() {
  if (process.argv.includes('--sitemaps-only')) {
    const index = await check('/sitemap.xml');
    for (const [, url] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) await check(new URL(url).pathname);
    console.log('Sitemap HTTP preflight passed; database eligibility coverage still requires an independent comparison.');
    return;
  }
  const home = await check('/');
  for (const path of ['/movies', '/movies?page=2', '/genre/horror', '/origin/united-states-english', '/year/2025', '/popular/top-rated', '/about', '/methodology', '/contact', '/search?q=space', '/feed.xml', '/robots.txt']) await check(path);
  const movie = home.match(/href="(\/watch\/[^"?]+)"/)?.[1];
  assert.ok(movie, 'homepage links to a movie');
  const detail = await check(movie);
  const person = detail.match(/href="(\/person\/[^"?]+)"/)?.[1];
  if (person) await check(person);
  await check('/movies?page=0', 404);
  await check('/genre/not-a-real-genre', 404);
  await check('/person/not-a-real-person', 404);
  const index = await check('/sitemap.xml');
  for (const [, url] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) await check(new URL(url).pathname);
  console.log('SEO preflight passed. This is not a ranking, load-capacity, or public-DNS certification.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'SEO preflight failed');
  process.exitCode = 1;
});
