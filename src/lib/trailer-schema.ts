export function formatTrailerTitle(
  movieTitle: string,
  rawTrailerTitle?: string | null,
  year?: number | null,
): string {
  const cleanMovie = movieTitle.replace(/\s+/g, ' ').trim();
  const cleanTrailer = (rawTrailerTitle || '').replace(/\s+/g, ' ').trim();
  const yearPart = year ? ` (${year})` : '';

  if (!cleanTrailer) {
    return `${cleanMovie}${yearPart} Official Trailer`;
  }
  if (cleanMovie && cleanTrailer.toLowerCase().includes(cleanMovie.toLowerCase())) {
    return cleanTrailer;
  }
  return `${cleanMovie}${yearPart} — ${cleanTrailer}`;
}

export function trailerSchema(input: {
  videoId: string | null | undefined;
  title: string;
  description: string;
  movieTitle?: string;
  year?: number | null;
  thumbnailUrl?: string | null;
  publishedDate?: Date | string | null;
  isFamilyFriendly?: boolean;
  inLanguage?: string | null;
}) {
  if (!input.videoId || !/^[A-Za-z0-9_-]{11}$/.test(input.videoId)) return undefined;
  const published = input.publishedDate ? new Date(input.publishedDate) : null;
  const name = input.movieTitle
    ? formatTrailerTitle(input.movieTitle, input.title, input.year)
    : input.title;
  return {
    '@type': 'VideoObject',
    name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl || `https://i.ytimg.com/vi/${input.videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${input.videoId}`,
    ...(typeof input.isFamilyFriendly === 'boolean' ? { isFamilyFriendly: input.isFamilyFriendly } : {}),
    ...(input.inLanguage?.trim() ? { inLanguage: input.inLanguage.trim() } : {}),
    // A film's theatrical release date is not its trailer upload date.
    ...(published && Number.isFinite(published.getTime()) ? { uploadDate: published.toISOString() } : {}),
  };
}
