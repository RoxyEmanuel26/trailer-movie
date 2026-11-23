'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  Clock,
  Download,
  Film,
  Link2,
  Play,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  buildSharedWatchlistPath,
  MAX_WATCHLIST_ITEMS,
  readLocalWatchlist,
  WATCHLIST_EVENT_NAME,
  WATCHLIST_STORAGE_KEY,
  writeLocalWatchlist,
  type WatchlistEntry,
} from '@/lib/watchlist';
import { moviePath } from '@/lib/public-routes';

export interface SharedWatchlistMovie {
  id: string;
  tmdbId: number | null;
  slug: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  voteAverage: number | null;
}

interface WatchlistClientProps {
  sharedMovies: SharedWatchlistMovie[];
  isSharedView: boolean;
  siteUrl: string;
}

function formatTotalRuntime(items: Array<{ runtimeMinutes: number | null }>): string | null {
  const totalMinutes = items.reduce((acc, m) => acc + (m.runtimeMinutes || 0), 0);
  if (totalMinutes <= 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function WatchlistClient({
  sharedMovies,
  isSharedView,
  siteUrl,
}: WatchlistClientProps) {
  const [localItems, setLocalItems] = React.useState<WatchlistEntry[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      setLocalItems(readLocalWatchlist());
      setHydrated(true);
    };
    sync();

    const onCustom = () => sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === WATCHLIST_STORAGE_KEY) sync();
    };
    window.addEventListener(WATCHLIST_EVENT_NAME, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT_NAME, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const displayedItems = isSharedView ? sharedMovies : localItems;
  const totalRuntimeLabel = formatTotalRuntime(displayedItems);

  const sharePath = buildSharedWatchlistPath(displayedItems);
  const shareUrl = React.useMemo(() => {
    if (!sharePath) return null;
    const base =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : siteUrl.replace(/\/+$/, '');
    return `${base}${sharePath}`;
  }, [sharePath, siteUrl]);

  const handleCopyShareUrl = async () => {
    if (!shareUrl) {
      toast.info('Save at least one movie to generate a shareable Watchlist link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Shareable Watchlist link copied!');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleRemove = (id: string, title: string) => {
    const next = localItems.filter((item) => item.id !== id);
    writeLocalWatchlist(next);
    setLocalItems(next);
    toast.info(`Removed "${title}" from your Watchlist`);
  };

  const handleClearAll = () => {
    writeLocalWatchlist([]);
    setLocalItems([]);
    toast.info('Cleared your Watchlist');
  };

  const handleImportShared = () => {
    if (!sharedMovies.length) return;
    const current = readLocalWatchlist();
    const existingIds = new Set(current.map((item) => item.id));
    const additions: WatchlistEntry[] = sharedMovies
      .filter((movie) => !existingIds.has(movie.id))
      .map((movie) => ({
        ...movie,
        savedAt: Date.now(),
      }));
    const merged = [...additions, ...current].slice(0, MAX_WATCHLIST_ITEMS);
    writeLocalWatchlist(merged);
    setLocalItems(merged);
    toast.success(
      additions.length > 0
        ? `Imported ${additions.length} ${additions.length === 1 ? 'movie' : 'movies'} into your Watchlist!`
        : 'All movies from this shared list are already in your Watchlist.',
    );
  };

  if (!isSharedView && !hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Shared Watchlist Banner */}
      {isSharedView ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary/8 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Shared Movie Watchlist
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You are viewing a shared list of {sharedMovies.length}{' '}
              {sharedMovies.length === 1 ? 'movie' : 'movies'}. Import them to your personal browser Watchlist in one click.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sharedMovies.length > 0 ? (
              <button
                type="button"
                onClick={handleImportShared}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Import All to My Watchlist</span>
              </button>
            ) : null}
            <Link
              href="/watchlist"
              className="inline-flex min-h-10 items-center rounded-xl border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
            >
              View My Watchlist
            </Link>
          </div>
        </div>
      ) : null}

      {/* Summary + Share Toolbar */}
      {displayedItems.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="font-semibold tabular-nums text-foreground">
                {displayedItems.length}
              </strong>{' '}
              {displayedItems.length === 1 ? 'movie' : 'movies'}
            </span>
            {totalRuntimeLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Total runtime: {totalRuntimeLabel}</span>
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {shareUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Share Watchlist Link'}</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out my movie watchlist on MovieFlix (${displayedItems.length} films): ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(`My movie watchlist on MovieFlix (${displayedItems.length} picks):`)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  X / Twitter
                </a>
              </>
            ) : null}

            {!isSharedView ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear all</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Movie Grid or Empty State */}
      {displayedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6 lg:gap-y-8">
          {displayedItems.map((movie) => (
            <div key={movie.id} className="group flex min-w-0 flex-col gap-2.5">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[0.9rem] bg-muted shadow-md ring-1 ring-black/5 sm:rounded-[1.1rem] dark:ring-white/10">
                <Link href={moviePath(movie.slug)} prefetch={false} className="block h-full w-full">
                  {movie.posterUrl ? (
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 220px"
                      className="object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-75"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      <Film className="h-8 w-8 opacity-40" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </div>
                  </div>
                </Link>

                {movie.voteAverage ? (
                  <div className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur-md">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {movie.voteAverage.toFixed(1)}
                  </div>
                ) : null}

                {!isSharedView ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(movie.id, movie.title)}
                    aria-label={`Remove ${movie.title} from Watchlist`}
                    title="Remove from Watchlist"
                    className="absolute left-2 top-2 z-20 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/75 text-white backdrop-blur-md transition hover:bg-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <div className="min-w-0">
                <Link
                  href={moviePath(movie.slug)}
                  prefetch={false}
                  className="line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.02em] transition-colors hover:text-primary sm:text-base"
                >
                  {movie.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {movie.releaseYear || 'TBA'}
                  {movie.runtimeMinutes ? ` · ${movie.runtimeMinutes}m` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cinema-panel flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center sm:py-24">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Bookmark className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold">
            {isSharedView ? 'No published movies matched this shared link' : 'Your Watchlist is empty'}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Tap &ldquo;Save to Watchlist&rdquo; on any movie page or swipe right in the Movie Night Picker to build a shareable list—no account needed.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tonight"
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Try Movie Night Picker</span>
            </Link>
            <Link
              href="/upcoming"
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
            >
              Browse Upcoming Trailers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
