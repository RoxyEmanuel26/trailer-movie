import * as React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { NavbarSearch } from './NavbarSearch';
import { NavbarThemeToggle } from './NavbarThemeToggle';
import { NavbarMobile } from './NavbarMobile';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="font-bold inline-block">TrailerTube</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/search?status=PUBLISHED"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Movies
            </Link>
            <div className="group relative flex items-center">
              <button className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Genres
              </button>
              {/* Mega Menu Dropdown */}
              <div className="absolute left-0 top-full hidden w-[600px] pt-4 group-hover:block">
                <div className="rounded-md border bg-popover p-4 shadow-md">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Hardcoded a few genres for now, could be passed as props if needed */}
                    <Link href="/genre/action" className="text-sm hover:underline">Action</Link>
                    <Link href="/genre/comedy" className="text-sm hover:underline">Comedy</Link>
                    <Link href="/genre/drama" className="text-sm hover:underline">Drama</Link>
                    <Link href="/genre/horror" className="text-sm hover:underline">Horror</Link>
                    <Link href="/genre/sci-fi" className="text-sm hover:underline">Sci-Fi</Link>
                    <Link href="/genre/thriller" className="text-sm hover:underline">Thriller</Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NavbarSearch />
          <NavbarThemeToggle />
          <NavbarMobile />
        </div>
      </div>
    </header>
  );
}
