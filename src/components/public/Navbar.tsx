import * as React from 'react';
import Link from 'next/link';
import { NavbarSearch } from './NavbarSearch';
import { NavbarThemeToggle } from './NavbarThemeToggle';
import { NavbarMobile } from './NavbarMobile';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { BrowseNav } from './BrowseNav';
import { MovieFlixLogo } from '@/components/brand/MovieFlixLogo';

export async function Navbar() {
  const [genres, years] = await Promise.all([
    GenreService.listGenres(),
    MovieService.listPublishedReleaseYears(),
  ]);

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
