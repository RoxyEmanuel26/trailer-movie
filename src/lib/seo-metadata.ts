import { absoluteUrl, canonicalUrl } from './site-config';
import { getTmdbImageUrl } from './tmdb-image-loader';

/** A CMS override for page one must not collapse every paginated URL into it. */
export function catalogMetadataCanonical(candidate: string | null | undefined, path: string) {
  const page = new URL(path, 'https://movieflix.invalid').searchParams.get('page');
  return page && /^[1-9]\d*$/.test(page) && Number(page) > 1
    ? absoluteUrl(path)
    : canonicalUrl(candidate, path);
}

export function paginatedMetadataTitle(title: string, path: string) {
  const page = new URL(path, 'https://movieflix.invalid').searchParams.get('page');
  if (!page || !/^[1-9]\d*$/.test(page) || Number(page) <= 1) return title;
  return new RegExp(`\\bPage\\s+${page}\\b`, 'i').test(title) ? title : `${title} — Page ${page}`;
}

export function socialImage(image: string | null | undefined, alt: string) {
  if (!image) return { url: absoluteUrl('/opengraph-image'), width: 1200, height: 630, alt };
  // Artwork is not necessarily a 1200x630 crop. Do not advertise invented
  // dimensions to social crawlers, or download unbounded TMDB originals.
  return { url: getTmdbImageUrl(image, 1280), alt };
}
