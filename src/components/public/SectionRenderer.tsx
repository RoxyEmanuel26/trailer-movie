import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { HomepageService } from '@/lib/services/HomepageService';

interface SectionRendererProps {
  section: {
    id: string;
    title: string;
    type: 'AUTO_RECENT' | 'AUTO_UPCOMING' | 'AUTO_TRENDING' | 'MANUAL_COLLECTION' | 'GENRE_BASED' | 'AD_SLOT';
    collectionId?: string | null;
    genreId?: string | null;
    collection?: { id: string; title: string; slug: string } | null;
    genre?: { id: string; name: string; slug: string } | null;
  };
}

export async function SectionRenderer({ section }: SectionRendererProps) {
  if (section.type === 'AD_SLOT') {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="w-full h-32 bg-muted flex items-center justify-center rounded-xl border border-dashed">
          <span className="text-muted-foreground text-sm uppercase tracking-widest">{section.title}</span>
        </div>
      </section>
    );
  }

  const { movies, viewAllLink } = await HomepageService.getSectionData(section);

  if (movies.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} priority={index < 4} />
        ))}
      </div>
    </section>
  );
}
