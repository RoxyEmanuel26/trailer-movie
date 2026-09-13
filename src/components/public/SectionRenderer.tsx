import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { HomepageService } from '@/lib/services/HomepageService';

interface SectionRendererProps {
  section: {
    id: string;
    title: string;
    type:
      | 'AUTO_RECENT'
      | 'AUTO_UPCOMING'
      | 'AUTO_TRENDING'
      | 'MANUAL_COLLECTION'
      | 'GENRE_BASED'
      | 'AD_SLOT';
    collectionId?: string | null;
    genreId?: string | null;
    collection?: { id: string; title: string; slug: string } | null;
    genre?: { id: string; name: string; slug: string } | null;
  };
}

export async function SectionRenderer({ section }: SectionRendererProps) {
  if (section.type === 'AD_SLOT') {
    return (
      <section className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-dashed bg-muted/50">
          <span className="text-muted-foreground text-sm uppercase tracking-widest">
            {section.title}
          </span>
        </div>
      </section>
    );
  }

  const { movies, viewAllLink } = await HomepageService.getSectionData(section);

  if (movies.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
        <div>
          <p className="eyebrow mb-2">Curated from the catalog</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{section.title}</h2>
        </div>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex min-h-11 shrink-0 items-center rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} priority={index < 4} />
        ))}
      </div>
    </section>
  );
}
