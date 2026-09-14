'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';
import { MovieFlixMark } from '@/components/brand/MovieFlixLogo';

interface NavbarMobileProps {
  genres: Array<{ id: string; name: string; slug: string }>;
  years: number[];
}

export function NavbarMobile({ genres, years }: NavbarMobileProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
    }
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-[min(92vw,25rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-6"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="/movies"
              aria-current={pathname === '/movies' ? 'page' : undefined}
              className={cn(
                'mobile-nav-link font-semibold',
                pathname === '/movies' && 'bg-muted text-primary'
              )}
              onClick={closeMenu}
            >
              All movies
            </Link>

            <MobileNavSection
              label="Genres"
              active={pathname === '/genres' || pathname.startsWith('/genre/')}
            >
              <Link
                href="/genres"
                className="mobile-nav-link font-semibold text-primary"
                onClick={closeMenu}
              >
                View all genres
              </Link>
              {genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
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

            <MobileNavSection label="Popular" active={pathname.startsWith('/popular')}>
              <Link href="/popular" className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Popular overview</Link>
              {POPULAR_CATALOG.map((item) => (
                <Link
                  key={item.slug}
                  href={`/popular/${item.slug}`}
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
              <Link href="/countries" className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Countries overview</Link>
              {ORIGIN_CATALOG.map((item) => (
                <Link
                  key={item.slug}
                  href={`/origin/${item.slug}`}
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
              <Link href="/years" className="mobile-nav-link font-semibold text-primary" onClick={closeMenu}>Years overview</Link>
              <div className="grid grid-cols-3 gap-1">
                {years.map((year) => (
                  <Link
                    key={year}
                    href={`/year/${year}`}
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
