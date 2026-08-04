import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { prisma } from '@/lib/prisma'; // Fetching directly or via service
import { MovieRepository } from '@/lib/repositories/MovieRepository';

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
  let movies: any[] = [];
  let viewAllLink = '';

  switch (section.type) {
    case 'AUTO_RECENT':
      const recent = await MovieRepository.list({ status: 'PUBLISHED', take: 6 });
      movies = recent.data;
      viewAllLink = '/search?status=PUBLISHED';
      break;

    case 'AUTO_UPCOMING':
      // Upcoming: releaseDate > now
      const upcoming = await prisma.movie.findMany({
        where: { status: 'PUBLISHED', releaseDate: { gt: new Date() } },
        orderBy: { releaseDate: 'asc' },
        take: 6,
      });
      movies = upcoming;
      viewAllLink = '/search?status=PUBLISHED&sort=releaseDate_asc';
      break;

    case 'AUTO_TRENDING':
      // Trending: placeholder logic for trending (e.g. recent high rating or views)
      const trending = await MovieRepository.list({ status: 'PUBLISHED', take: 6 });
      movies = trending.data;
      viewAllLink = '/search?status=PUBLISHED';
      break;

    case 'MANUAL_COLLECTION':
      if (section.collectionId) {
        const collection = await prisma.collection.findUnique({
          where: { id: section.collectionId },
          include: {
            movies: {
              include: { movie: true },
              orderBy: { sortOrder: 'asc' },
              take: 6,
            }
          }
        });
        if (collection) {
          movies = collection.movies.map(cm => cm.movie).filter(m => m.status === 'PUBLISHED');
          viewAllLink = `/collection/${section.collection?.slug}`;
        }
      }
      break;

    case 'GENRE_BASED':
      if (section.genreId) {
        const genreMovies = await prisma.movie.findMany({
          where: {
            status: 'PUBLISHED',
            genres: { some: { genreId: section.genreId } }
          },
          orderBy: { releaseDate: 'desc' },
          take: 6,
        });
        movies = genreMovies;
        viewAllLink = `/genre/${section.genre?.slug}`;
      }
      break;

    case 'AD_SLOT':
      return (
        <section className="container mx-auto px-4 py-8">
          <div className="w-full h-32 bg-muted flex items-center justify-center rounded-xl border border-dashed">
            <span className="text-muted-foreground text-sm uppercase tracking-widest">{section.title}</span>
          </div>
        </section>
      );
  }

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
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
