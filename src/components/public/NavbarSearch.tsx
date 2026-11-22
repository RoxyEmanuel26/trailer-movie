'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Film, Loader2, Search, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { moviePath } from '@/lib/public-routes';

interface QuickSearchMovie {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

export function NavbarSearch() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<QuickSearchMovie[]>([]);
  const [totalResults, setTotalResults] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&page=1`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults([]);
          setTotalResults(0);
          return;
        }
        const json = await res.json();
        const items: QuickSearchMovie[] = Array.isArray(json?.data?.data) ? json.data.data : [];
        const total = typeof json?.data?.total === 'number' ? json.data.total : items.length;
        setResults(items.slice(0, 6));
        setTotalResults(total);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setTotalResults(0);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  React.useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  if (isSearchOpen) {
    const showDropdown = searchQuery.trim().length >= 2 && results.length > 0;
    return (
      <div ref={containerRef} className="relative hidden md:block">
        <form onSubmit={handleSearch} className="flex items-center relative">
          <Input
            type="search"
            placeholder="Search movies..."
            className="w-64 pr-8 lg:w-72"
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              const next = e.target.value;
              setSearchQuery(next);
              if (next.trim().length < 2) {
                setResults([]);
                setTotalResults(0);
                setIsLoading(false);
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-full px-2"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
              setResults([]);
              setTotalResults(0);
              setIsLoading(false);
            }}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </form>

        {showDropdown ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur-xl lg:w-96">
            <div className="divide-y">
              {results.map((movie) => {
                const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
                return (
                  <Link
                    key={movie.id}
                    href={moviePath(movie.slug)}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                      {movie.posterUrl ? (
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Film className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{movie.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {year ? <span>{year}</span> : null}
                        {movie.voteAverage ? (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <Star className="h-3 w-3 fill-current" />
                            {movie.voteAverage.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {results.length > 0 ? (
              <Link
                href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                onClick={() => setIsSearchOpen(false)}
                className="block border-t bg-muted/40 px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-muted"
              >
                View all {totalResults.toLocaleString()} results for &ldquo;{searchQuery.trim()}&rdquo;
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsSearchOpen(true)}
      className="hidden h-11 w-11 md:flex"
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">Search</span>
    </Button>
  );
}
