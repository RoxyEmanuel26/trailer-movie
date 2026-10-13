import * as React from 'react';
import Link from 'next/link';
import { NavbarSearch } from './NavbarSearch';
import { NavbarThemeToggle } from './NavbarThemeToggle';
import { NavbarMobile } from './NavbarMobile';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { BrowseNav } from './BrowseNav';
import { MovieFlixLogo } from '@/components/brand/MovieFlixLogo';
import { unstable_cache } from 'next/cache';
import { isTransientDatabaseError } from '@/lib/database-errors';
import { logger } from '@/lib/logger';
import { loadPublicDataWithSnapshot } from '@/lib/public-catalog-snapshot';

type BrowseNavigationData = {
  genres: Array<{ id: string; name: string; slug: string }>;
  years: number[];
};

function isBrowseNavigationData(value: unknown): value is BrowseNavigationData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return Array.isArray(data.genres)
    && data.genres.every((genre) => genre && typeof genre.id === 'string'
      && typeof genre.name === 'string' && typeof genre.slug === 'string')
    && Array.isArray(data.years)
    && data.years.every((year) => Number.isSafeInteger(year));
}
let lastNavigationWarningAt = 0;

function warnNavigationFallback(message: string) {
  if (Date.now() - lastNavigationWarningAt < 60_000) return;
  lastNavigationWarningAt = Date.now();
  logger.warn(message);
}

const getBrowseNavigation = unstable_cache(
  () => loadPublicDataWithSnapshot('browse-navigation-v1', async () => {
    const [genres, years] = await Promise.all([
      GenreService.listGenres(),
      MovieService.listPublishedReleaseYears(),
    ]);
    return { genres, years };
  }, isBrowseNavigationData),
  ['public-browse-navigation-v2'],
  { revalidate: 3600 },
);

export async function Navbar() {
  let navigation: BrowseNavigationData;
  try {
    const result = await getBrowseNavigation();
    if (result.source === 'snapshot') warnNavigationFallback('Browse navigation is using the last valid catalog snapshot');
    navigation = result.data;
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error;
    warnNavigationFallback('Browse navigation database unavailable and no recent snapshot exists');
    navigation = { genres: [], years: [] };
  }
  const { genres, years } = navigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="MovieFlix home">
            <MovieFlixLogo
              markClassName="transition-transform duration-200 group-hover:-rotate-3 group-active:scale-95"
              wordmarkClassName="text-[1.05rem]"
            />
          </Link>
          <BrowseNav genres={genres} years={years} />
        </div>

        <div className="flex items-center gap-2">
          <NavbarSearch />
          <NavbarThemeToggle />
          <NavbarMobile genres={genres} years={years} />
        </div>
      </div>
    </header>
  );
}
