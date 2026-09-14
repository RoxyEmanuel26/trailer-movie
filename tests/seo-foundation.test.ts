import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStrictPage, pagePath, isPageOutOfRange } from '../src/lib/pagination';
import { serializeJsonLd } from '../src/components/seo/JsonLd';
import { serializeSitemap } from '../src/lib/sitemap-xml';
import { getTmdbImageUrl } from '../src/lib/tmdb-image-loader';
import { moviePath } from '../src/lib/public-routes';
import { canonicalUrl, isValidContactEmail, validateProductionSeoConfig } from '../src/lib/site-config';
import { escapeCdata } from '../src/lib/services/SeoService';

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

test('indexing requires verification and a real contact email', () => {
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true }) || '', /GOOGLE_SITE_VERIFICATION/);
  assert.match(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token' }) || '', /CONTACT_EMAIL/);
  assert.equal(validateProductionSeoConfig({ url: 'https://www.movieflix.site', indexingEnabled: true, googleVerification: 'token', contactEmail: 'editor@movieflix.site' }), null);
  assert.equal(isValidContactEmail('not-an-email'), false);
});

test('RSS CDATA content cannot terminate its wrapper', () => {
  assert.equal(escapeCdata('before]]>after'), 'before]]]]><![CDATA[>after');
});
