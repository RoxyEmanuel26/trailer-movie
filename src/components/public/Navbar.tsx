'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, Film, Sun, Moon, X } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

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
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <Input
                type="search"
                placeholder="Search movies..."
                className="w-64 pr-8"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 h-full px-2"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 py-4">
                <Link href="/" className="flex items-center space-x-2 pb-4 border-b">
                  <Film className="h-6 w-6" />
                  <span className="font-bold">TrailerTube</span>
                </Link>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <div className="flex flex-col space-y-3 mt-4">
                  <Link href="/search?status=PUBLISHED" className="text-sm font-medium">Movies</Link>
                  <Link href="/genre/action" className="text-sm font-medium">Action</Link>
                  <Link href="/genre/comedy" className="text-sm font-medium">Comedy</Link>
                  <Link href="/genre/drama" className="text-sm font-medium">Drama</Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
