function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildMovieEmbedSnippet(input: {
  siteUrl: string;
  slug: string;
  title: string;
  year?: number | null;
}): {
  embedUrl: string;
  watchUrl: string;
  html: string;
} {
  const base = input.siteUrl.replace(/\/+$/, '');
  const cleanSlug = encodeURIComponent(input.slug.trim());
  const embedUrl = `${base}/embed/watch/${cleanSlug}`;
  const watchUrl = `${base}/watch/${cleanSlug}`;
  const label = input.year ? `${input.title} (${input.year})` : input.title;
  const safeTitle = escapeHtmlAttr(`${label} — Official Trailer & Streaming Guide`);
  const safeAnchor = escapeHtmlAttr(`Watch ${label} trailer & streaming guide on MovieFlix`);

  const html = [
    `<iframe src="${embedUrl}" title="${safeTitle}" width="100%" height="360" style="max-width:680px;border:0;border-radius:16px;overflow:hidden;" loading="lazy" allowfullscreen></iframe>`,
    `<p style="font-size:12px;margin-top:6px;"><a href="${watchUrl}" target="_blank" rel="noopener">${safeAnchor}</a></p>`,
  ].join('\n');

  return { embedUrl, watchUrl, html };
}
