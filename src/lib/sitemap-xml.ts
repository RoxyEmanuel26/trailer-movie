export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: string;
  priority?: number;
  image?: { loc: string; title?: string };
  video?: {
    thumbnailLoc: string;
    title: string;
    description: string;
    playerLoc: string;
    publicationDate?: Date | string;
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeSitemap(entries: SitemapEntry[]) {
  entries = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
  if (entries.length > 50_000) throw new Error('Sitemap exceeds the 50,000 URL limit.');
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>`
        : '';
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`
        : '';
      const priority =
        typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : '';
      const image = entry.image
        ? `<image:image><image:loc>${escapeXml(entry.image.loc)}</image:loc>${entry.image.title ? `<image:title>${escapeXml(entry.image.title)}</image:title>` : ''}</image:image>`
        : '';
      const video = entry.video
        ? `<video:video><video:thumbnail_loc>${escapeXml(entry.video.thumbnailLoc)}</video:thumbnail_loc><video:title>${escapeXml(entry.video.title)}</video:title><video:description>${escapeXml(entry.video.description)}</video:description><video:player_loc>${escapeXml(entry.video.playerLoc)}</video:player_loc>${entry.video.publicationDate ? `<video:publication_date>${escapeXml(new Date(entry.video.publicationDate).toISOString())}</video:publication_date>` : ''}</video:video>`
        : '';

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}${image}${video}</url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}</urlset>`;
  if (new TextEncoder().encode(xml).byteLength > 50 * 1024 * 1024) throw new Error('Sitemap exceeds the 50 MB uncompressed limit.');
  return xml;
}

export type SitemapIndexItem = string | { url: string; lastModified?: Date | string };

export function serializeSitemapIndex(items: SitemapIndexItem[]) {
  const sitemaps = items
    .map((item) => {
      const entry = typeof item === 'string' ? { url: item } : item;
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>`
        : '';
      return `<sitemap><loc>${escapeXml(entry.url)}</loc>${lastModified}</sitemap>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}

export function xmlResponse(xml: string, options: { status?: number; stale?: boolean } = {}) {
  return new Response(xml, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400, stale-if-error=86400',
      'CDN-Cache-Control': 'public, max-age=900, stale-while-revalidate=86400, stale-if-error=86400',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=900, stale-while-revalidate=86400, stale-if-error=86400',
      ...(options.stale ? { Warning: '110 - "Response is stale"', 'X-Sitemap-Snapshot': 'stale' } : {}),
    },
  });
}

export function sitemapUnavailableResponse() {
  return xmlResponse(
    '<?xml version="1.0" encoding="UTF-8"?>\n<error><message>Sitemap temporarily unavailable</message></error>',
    { status: 503 },
  );
}
