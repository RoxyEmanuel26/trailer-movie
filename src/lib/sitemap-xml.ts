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

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urls}</urlset>`;
}

export function serializeSitemapIndex(urls: string[]) {
  const sitemaps = urls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
