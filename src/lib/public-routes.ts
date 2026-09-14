export function personPath(slug: string) {
  return `/person/${encodeURIComponent(slug)}`;
}

export function publicMovieSlug(slug: string) {
  const emptyTextSlug = slug.match(/^-(\d+)$/);
  return emptyTextSlug ? `movie-${emptyTextSlug[1]}` : slug;
}

export function moviePath(slug: string) {
  return `/watch/${encodeURIComponent(publicMovieSlug(slug))}`;
}
