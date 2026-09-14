import type { ImageLoaderProps } from 'next/image';

const TMDB_WIDTHS = [92, 154, 185, 300, 342, 500, 780, 1280];

function closestTmdbWidth(width: number) {
  return TMDB_WIDTHS.find((candidate) => candidate >= width) || TMDB_WIDTHS.at(-1)!;
}

export function getTmdbImageUrl(src: string, width: number) {
  if (!src.startsWith('https://image.tmdb.org/t/p/')) return src;
  return src.replace(
    /\/t\/p\/(?:original|w\d+|h\d+)\//,
    `/t/p/w${closestTmdbWidth(width)}/`
  );
}

export default function tmdbImageLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith('https://image.tmdb.org/t/p/')) {
    return getTmdbImageUrl(src, width);
  }

  if (src.startsWith('/')) return `${src}?w=${width}&q=${quality || 75}`;

  try {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    if (quality) url.searchParams.set('q', String(quality));
    return url.toString();
  } catch {
    return src;
  }
}
