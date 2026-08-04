'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NavbarSearch() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'search',
          metadata: { query: searchQuery.trim(), resultsCount: 0 },
        }),
        keepalive: true,
      }).catch(console.error);

      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  if (isSearchOpen) {
    return (
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
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsSearchOpen(true)}
      className="hidden md:flex"
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">Search</span>
    </Button>
  );
}
