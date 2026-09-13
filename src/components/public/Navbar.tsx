import * as React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { NavbarSearch } from './NavbarSearch';
import { NavbarThemeToggle } from './NavbarThemeToggle';
import { NavbarMobile } from './NavbarMobile';
import { GenreService } from '@/lib/services/GenreService';
import { MovieService } from '@/lib/services/MovieService';
import { BrowseNav } from './BrowseNav';

export async function Navbar() {
  const [genres, years] = await Promise.all([
    GenreService.listGenres(),
    MovieService.listPublishedReleaseYears(),
  ]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="TrailerTube home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform duration-200 group-hover:-rotate-3 group-active:scale-95">
              <Film className="h-4.5 w-4.5" />
            </span>
            <span className="text-[1.05rem] font-semibold tracking-[-0.035em]">TrailerTube</span>
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
