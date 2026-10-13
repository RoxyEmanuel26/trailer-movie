export function trailerSchema(input: {
  videoId: string | null | undefined;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  publishedDate?: Date | string | null;
}) {
  if (!input.videoId || !/^[A-Za-z0-9_-]{11}$/.test(input.videoId)) return undefined;
  const published = input.publishedDate ? new Date(input.publishedDate) : null;
  return {
    '@type': 'VideoObject',
    name: input.title,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl || `https://i.ytimg.com/vi/${input.videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${input.videoId}`,
    // A film's theatrical release date is not its trailer upload date.
    ...(published && Number.isFinite(published.getTime()) ? { uploadDate: published.toISOString() } : {}),
  };
}
