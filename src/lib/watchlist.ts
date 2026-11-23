export interface WatchlistEntry {
  id: string;
  tmdbId: number | null;
  slug: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  voteAverage: number | null;
  savedAt: number;
}

export const WATCHLIST_STORAGE_KEY = 'movieflix_watchlist_v1';
export const WATCHLIST_EVENT_NAME = 'movieflix:watchlist-updated';
export const MAX_WATCHLIST_ITEMS = 100;
export const MAX_SHARED_WATCHLIST_IDS = 40;

export function parseSharedWatchlistIds(raw: string | string[] | undefined): number[] {
  const str = Array.isArray(raw) ? raw.join(',') : raw || '';
  if (!str.trim()) return [];
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const token of str.split(',')) {
    const trimmed = token.trim();
    if (!/^\d{1,9}$/.test(trimmed)) continue;
    const num = Number(trimmed);
    if (!Number.isSafeInteger(num) || num <= 0 || seen.has(num)) continue;
    seen.add(num);
    ids.push(num);
    if (ids.length >= MAX_SHARED_WATCHLIST_IDS) break;
  }
  return ids;
}

export function buildSharedWatchlistPath(entries: Array<{ tmdbId: number | null }>): string | null {
  const ids = entries
    .map((e) => e.tmdbId)
    .filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
    .slice(0, MAX_SHARED_WATCHLIST_IDS);
  if (ids.length === 0) return null;
  return `/watchlist?ids=${ids.join(',')}`;
}

export function readLocalWatchlist(): WatchlistEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is WatchlistEntry =>
          Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.slug === 'string' && typeof item.title === 'string'),
      )
      .slice(0, MAX_WATCHLIST_ITEMS);
  } catch {
    return [];
  }
}

export function writeLocalWatchlist(entries: WatchlistEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    const bounded = entries.slice(0, MAX_WATCHLIST_ITEMS);
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(bounded));
    window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT_NAME, { detail: bounded }));
  } catch {
    // Ignore private-browsing quota errors
  }
}

export function toggleWatchlistEntry(entry: Omit<WatchlistEntry, 'savedAt'>): {
  saved: boolean;
  items: WatchlistEntry[];
} {
  const current = readLocalWatchlist();
  const exists = current.some((item) => item.id === entry.id || item.slug === entry.slug);
  const next = exists
    ? current.filter((item) => item.id !== entry.id && item.slug !== entry.slug)
    : [{ ...entry, savedAt: Date.now() }, ...current].slice(0, MAX_WATCHLIST_ITEMS);
  writeLocalWatchlist(next);
  return { saved: !exists, items: next };
}
