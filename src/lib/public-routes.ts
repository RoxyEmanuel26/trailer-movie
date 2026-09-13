export function personPath(slug: string) {
  return `/person/${encodeURIComponent(slug)}`;
}
