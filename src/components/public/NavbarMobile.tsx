'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function NavbarMobile() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

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
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col gap-4 py-4">
          <Link href="/" className="flex items-center space-x-2 pb-4 border-b" onClick={closeMenu}>
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
            <Link href="/search?status=PUBLISHED" className="text-sm font-medium" onClick={closeMenu}>Movies</Link>
            <Link href="/genre/action" className="text-sm font-medium" onClick={closeMenu}>Action</Link>
            <Link href="/genre/comedy" className="text-sm font-medium" onClick={closeMenu}>Comedy</Link>
            <Link href="/genre/drama" className="text-sm font-medium" onClick={closeMenu}>Drama</Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
