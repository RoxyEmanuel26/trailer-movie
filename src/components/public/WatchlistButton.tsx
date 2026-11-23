'use client';

import * as React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  readLocalWatchlist,
  toggleWatchlistEntry,
  WATCHLIST_EVENT_NAME,
  WATCHLIST_STORAGE_KEY,
  type WatchlistEntry,
} from '@/lib/watchlist';

interface WatchlistButtonProps {
  movie: Omit<WatchlistEntry, 'savedAt'>;
  variant?: 'default' | 'compact';
  className?: string;
}

export function WatchlistButton({
  movie,
  variant = 'default',
  className = '',
}: WatchlistButtonProps) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      const list = readLocalWatchlist();
      setSaved(list.some((item) => item.id === movie.id || item.slug === movie.slug));
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
  }, [movie.id, movie.slug]);

  const handleToggle = () => {
    const result = toggleWatchlistEntry(movie);
    setSaved(result.saved);
    if (result.saved) {
      toast.success(`Saved "${movie.title}" to your Watchlist`);
    } else {
      toast.info(`Removed "${movie.title}" from your Watchlist`);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={saved}
        className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[.98] ${
          saved
            ? 'border-primary/40 bg-primary/12 text-primary'
            : 'bg-card text-foreground hover:border-primary/40 hover:text-primary'
        } ${className}`}
      >
        {saved ? (
          <>
            <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>In Watchlist</span>
          </>
        ) : (
          <>
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Watchlist</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={saved}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition active:scale-[.98] ${
        saved
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:text-primary'
      } ${className}`}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>In Watchlist</span>
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Save to Watchlist</span>
        </>
      )}
    </button>
  );
}
