import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GenreService } from '@/lib/services/GenreService';
import { SeoService } from '@/lib/services/SeoService';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'genres', {
    title: 'Movie genres',
    description: 'Browse every movie genre available in the TrailerTube catalog.',
    path: '/genres',
  });
}

export default async function GenresPage() {
  const genres = await GenreService.listGenres();
  const path = '/genres';
  const title = 'Every movie genre';
  const description = 'Browse every movie genre available in the TrailerTube catalog.';
  const jsonLd = [
    SeoService.generateStructuredData('CollectionPage', { title, description, path }),
    SeoService.generateStructuredData('BreadcrumbList', {
      items: [
        { name: 'Home', path: '/' },
        { name: 'Genres', path },
      ],
    }),
  ];

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">
          Genres
        </span>
      </nav>
      <header className="mb-8 max-w-3xl sm:mb-12">
        <p className="eyebrow mb-3">Explore by mood</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          Move from high-energy action to quiet drama, animation, documentary, and everything in
          between.
        </p>
      </header>
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {genres.map((genre, index) => (
          <Link
            key={genre.id}
            href={`/genre/${genre.slug}`}
            className="group flex min-h-24 items-end justify-between bg-card p-4 transition-colors hover:bg-accent active:bg-accent sm:min-h-32 sm:p-6"
          >
            <div>
              <span className="mb-4 block text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="text-xl font-semibold tracking-[-0.03em] group-hover:text-primary">
                {genre.name}
              </h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground transition duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
