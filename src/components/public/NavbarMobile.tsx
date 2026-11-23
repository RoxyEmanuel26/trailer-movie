'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, ChevronDown, Film, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';
import { STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { MovieFlixMark } from '@/components/brand/MovieFlixLogo';
import { moviePath } from '@/lib/public-routes';

interface NavbarMobileProps {
  genres: Array<{ id: string; name: string; slug: string }>;
  years: number[];
}

interface QuickSearchMovie {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

export function NavbarMobile({ genres, years }: NavbarMobileProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [results, setResults] = React.useState<QuickSearchMovie[]>([]);
  const [totalResults, setTotalResults] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!isOpen || trimmed.length < 2) {
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
        setResults(items.slice(0, 5));
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
  }, [searchQuery, isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setResults([]);
      setTotalResults(0);
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      handleOpenChange(false);
    }
  };

  const closeMenu = () => handleOpenChange(false);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-[min(92vw,25rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetDescription className="sr-only">
          Browse MovieFlix categories, genres, streaming services, and search movies.
        </SheetDescription>
        <div className="shrink-0 border-b bg-background/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex min-h-11 items-center space-x-2 pr-12" onClick={closeMenu}>
            <MovieFlixMark className="h-9 w-9 text-primary" />
            <SheetTitle className="font-semibold tracking-[-0.03em]">MovieFlix</SheetTitle>
          </Link>
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <Input
              type="search"
              placeholder="Search movies…"
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
              className="h-11"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
          {searchQuery.trim().length >= 2 && results.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-xl border bg-card/95 shadow-lg">
              <div className="divide-y">
                {results.map((movie) => {
                  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
                  return (
                    <Link
                      key={movie.id}
                      href={moviePath(movie.slug)}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent"
                    >
                      <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-muted">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Film className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{movie.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {year ? <span>{year}</span> : null}
                          {movie.voteAverage ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              {movie.voteAverage.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                onClick={closeMenu}
                className="block border-t bg-muted/40 px-3 py-2 text-center text-xs font-semibold text-primary"
              >
                View all {totalResults.toLocaleString()} results
              </Link>
            </div>
          ) : null}
        </div>
        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="/movies"
              prefetch={false}
              aria-current={pathname === '/movies' ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                pathname === '/movies' && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              All movies
            </Link>

            <Link
              href="/upcoming"
              prefetch={false}
              aria-current={pathname === '/upcoming' || pathname.startsWith('/upcoming/') ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                (pathname === '/upcoming' || pathname.startsWith('/upcoming/')) && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              Upcoming trailers
            </Link>

            <Link
              href="/tonight"
              prefetch={false}
              aria-current={pathname === '/tonight' ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold text-primary',
                pathname === '/tonight' && 'bg-muted'
              )}
              onClick={closeMenu}
            >
              What to watch tonight
            </Link>

            <Link
              href="/watchlist"
              prefetch={false}
              aria-current={pathname === '/watchlist' ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                pathname === '/watchlist' && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              My watchlist
            </Link>

            <Link
              href="/collections"
              prefetch={false}
              aria-current={pathname === '/collections' || pathname.startsWith('/collection/') ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                (pathname === '/collections' || pathname.startsWith('/collection/')) && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              Franchises in order
            </Link>

            <Link
              href="/studios"
              prefetch={false}
              aria-current={pathname === '/studios' || pathname.startsWith('/studio/') ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                (pathname === '/studios' || pathname.startsWith('/studio/')) && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              Film studios (A24, TOHO, BBC…)
            </Link>

            <Link
              href="/themes"
              prefetch={false}
              aria-current={pathname === '/themes' || pathname.startsWith('/theme/') ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                (pathname === '/themes' || pathname.startsWith('/theme/')) && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              Movie themes &amp; tropes
            </Link>

            <MobileNavSection
              label="Genres"
              active={pathname === '/genres' || pathname.startsWith('/genre/')}
            >
              <Link
                href="/genres"
                prefetch={false}
                className="mobile-nav-link font-semibold text-primary"
                onClick={closeMenu}
              >
                View all genres
              </Link>
              {genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  prefetch={false}
                  className={cn(
                    'mobile-nav-link',
                    pathname === `/genre/${genre.slug}` && 'bg-muted text-primary'
                  )}
                  aria-current={pathname === `/genre/${genre.slug}` ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {genre.name}
                </Link>
              ))}
            </MobileNavSection>

            <MobileNavSection label="Streaming" active={pathname.startsWith('/streaming')}>
              <Link href="/streaming" prefetch={false} className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>All streaming services</Link>
              {STREAMING_CATALOG.map((item) => (
                <Link
                  key={item.slug}
                  href={`/streaming/${item.slug}`}
                  prefetch={false}
                  className={cn(
                    'mobile-nav-link',
                    pathname === `/streaming/${item.slug}` && 'bg-muted text-primary'
                  )}
                  aria-current={pathname === `/streaming/${item.slug}` ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </MobileNavSection>

            <MobileNavSection label="Popular" active={pathname.startsWith('/popular')}>
              <Link href="/popular" prefetch={false} className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Popular overview</Link>
              {POPULAR_CATALOG.map((item) => (
                <Link
                  key={item.slug}
                  href={`/popular/${item.slug}`}
                  prefetch={false}
                  className={cn(
                    'mobile-nav-link',
                    pathname === `/popular/${item.slug}` && 'bg-muted text-primary'
                  )}
                  aria-current={pathname === `/popular/${item.slug}` ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </MobileNavSection>

            <MobileNavSection label="Countries" active={pathname.startsWith('/origin/') || pathname === '/countries'}>
              <Link href="/countries" prefetch={false} className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Countries overview</Link>
              {ORIGIN_CATALOG.map((item) => (
                <Link
                  key={item.slug}
                  href={`/origin/${item.slug}`}
                  prefetch={false}
                  className={cn(
                    'mobile-nav-link',
                    pathname === `/origin/${item.slug}` && 'bg-muted text-primary'
                  )}
                  aria-current={pathname === `/origin/${item.slug}` ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </MobileNavSection>

            <MobileNavSection label="Years" active={pathname.startsWith('/year/') || pathname === '/years'}>
              <Link href="/years" prefetch={false} className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Years overview</Link>
              <div className="grid grid-cols-3 gap-1">
                {years.map((year) => (
                  <Link
                    key={year}
                    href={`/year/${year}`}
                    prefetch={false}
                    className={cn(
                      'mobile-nav-link text-center tabular-nums',
                      pathname === `/year/${year}` && 'bg-muted text-primary'
                    )}
                    aria-current={pathname === `/year/${year}` ? 'page' : undefined}
                    onClick={closeMenu}
                  >
                    {year}
                  </Link>
                ))}
              </div>
            </MobileNavSection>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavSection({
  label,
  children,
  active = false,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <details className="group/mobile border-b border-border/60 py-1">
      <summary
        className={cn(
          'flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-muted active:bg-muted [&::-webkit-details-marker]:hidden',
          active && 'text-primary'
        )}
      >
        <span>
          {label}
          {active ? <span className="sr-only">, current section</span> : null}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open/mobile:rotate-180" />
      </summary>
      <div className="grid gap-1 pb-3 pl-2 pr-1">{children}</div>
    </details>
  );
}
