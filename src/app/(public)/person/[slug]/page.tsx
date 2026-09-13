import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Star, Film } from 'lucide-react';
import { ResponsiveDetails } from '@/components/public/ResponsiveDetails';
import { PersonService } from '@/lib/services/PersonService';
import { SeoService } from '@/lib/services/SeoService';

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: routeParam } = await params;
  const result = await PersonService.getPublicProfile(routeParam);

  if (!result) return notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);

  const { person, canonicalPath } = result;

  // Top movies stored in JSON field during import (fallback/extended)
  const topMovies = Array.isArray(person.topMovies) ? person.topMovies : [];
  const rawCatalogMovies = person.movies || [];

  // Group by movie ID so a person with multiple roles in a single movie doesn't create duplicate cards or React keys
  const catalogMovieMap = new Map<
    string,
    {
      movie: (typeof rawCatalogMovies)[0]['movie'];
      roles: string[];
    }
  >();

  for (const m of rawCatalogMovies) {
    const existing = catalogMovieMap.get(m.movie.id);
    const roleLabel =
      m.roleType === 'ACTOR' && m.characterName
        ? m.characterName
        : m.roleType.toLowerCase().replace('_', ' ');

    if (existing) {
      if (!existing.roles.includes(roleLabel)) {
        existing.roles.push(roleLabel);
      }
    } else {
      catalogMovieMap.set(m.movie.id, {
        movie: m.movie,
        roles: [roleLabel],
      });
    }
  }
  const catalogMovies = Array.from(catalogMovieMap.values());

  const jsonLd = [
    SeoService.generateStructuredData('Person', {
      path: canonicalPath,
      name: person.name,
      description: person.biography,
      image: person.headshotUrl,
      gender: person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : undefined,
      birthDate: person.birthday?.toISOString().split('T')[0],
      deathDate: person.deathday?.toISOString().split('T')[0],
      birthPlace: person.placeOfBirth,
      jobTitle: person.knownForDepartment,
      sameAs: person.imdbId ? [`https://www.imdb.com/name/${person.imdbId}`] : [],
    }),
    SeoService.generateStructuredData('BreadcrumbList', {
      items: [
        { name: 'Home', path: '/' },
        { name: person.name, path: canonicalPath },
      ],
    }),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="Breadcrumb" className="mb-7 text-sm text-muted-foreground sm:mb-9">
        <ol className="flex min-w-0 items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-foreground">
            {person.name}
          </li>
        </ol>
      </nav>
      <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div className="order-1 min-w-0 md:col-start-2 md:row-start-1">
          <p className="eyebrow mb-3">Cast & crew</p>
          <h1 className="break-words text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
            {person.name}
          </h1>
        </div>

        {/* Sidebar */}
        <aside className="order-2 flex flex-col md:col-start-1 md:row-span-2 md:row-start-1">
          <div className="relative order-2 mx-auto aspect-[2/3] w-full max-w-[13rem] overflow-hidden rounded-xl border bg-muted shadow-lg sm:max-w-[17rem] md:max-w-none">
            {person.headshotUrl ? (
              <Image
                src={person.headshotUrl}
                alt={person.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          <ResponsiveDetails label="Personal information" className="order-3 md:mt-6">
            <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Personal Info
              </h3>
              <dl className="space-y-4 text-sm">
                <div className="flex flex-col">
                  <dt className="text-muted-foreground font-medium">Known For</dt>
                  <dd className="font-semibold">{person.knownForDepartment || 'N/A'}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground font-medium">Gender</dt>
                  <dd className="font-semibold">
                    {person.gender === 1
                      ? 'Female'
                      : person.gender === 2
                        ? 'Male'
                        : 'Not specified'}
                  </dd>
                </div>
                {person.birthday && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium">Birthdate</dt>
                    <dd className="font-semibold">
                      {formatPersonDate(person.birthday)}{' '}
                      {person.deathday && ` - ${formatPersonDate(person.deathday)}`}
                    </dd>
                  </div>
                )}
                {person.placeOfBirth && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium">Place of Birth</dt>
                    <dd className="font-semibold">{person.placeOfBirth}</dd>
                  </div>
                )}
                {person.popularity && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium">Popularity Score</dt>
                    <dd className="font-semibold">{person.popularity.toFixed(1)}</dd>
                  </div>
                )}
                {person.imdbId && (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground font-medium">IMDb</dt>
                    <dd className="font-semibold">
                      <a
                        href={`https://www.imdb.com/name/${person.imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center text-xs text-primary hover:underline"
                      >
                        View IMDb Profile &rarr;
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </ResponsiveDetails>
        </aside>

        {/* Main Content */}
        <div className="order-3 flex min-w-0 flex-col gap-6 md:col-start-2 md:row-start-2">
          {person.biography && (
            <div className="order-4 md:order-none">
              <h2 className="text-xl font-semibold mb-3">Biography</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert md:prose-base">
                <p className="whitespace-pre-wrap break-words leading-7 sm:leading-8">
                  {person.biography}
                </p>
              </div>
            </div>
          )}

          {/* Movies in Catalog (Clickable to our site's watch page) */}
          {catalogMovies.length > 0 && (
            <div className="order-5 mt-4 md:order-none md:mt-8">
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">Movies in Catalog</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {catalogMovies.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {catalogMovies.map(({ movie, roles }) => {
                  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
                  return (
                    <Link
                      key={movie.id}
                      href={`/watch/${movie.slug}`}
                      className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border bg-card p-2 transition-all duration-300 hover:shadow-md active:scale-[.99] [@media(hover:hover)]:hover:scale-[1.02]"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Film className="w-8 h-8 opacity-40" />
                          </div>
                        )}

                        {movie.voteAverage ? (
                          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-yellow-400 backdrop-blur-sm">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{movie.voteAverage.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h3 className="line-clamp-1 font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                          {movie.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span className="line-clamp-1 capitalize">{roles.join(', ')}</span>
                          {year && <span>{year}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* External Notable Works (if catalog movies is empty or for extra context) */}
          {catalogMovies.length === 0 && topMovies.length > 0 && (
            <div className="order-5 mt-4 md:order-none md:mt-8">
              <h2 className="text-xl font-semibold mb-6">Known For (Movies)</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                {topMovies.map((m: any, idx: number) => (
                  <div
                    key={m.id ? `${m.id}-${idx}` : idx}
                    className="group relative flex flex-col gap-2 overflow-hidden"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                        alt={m.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="line-clamp-2 font-medium text-sm leading-tight group-hover:text-primary">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{m.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<import('next').Metadata> {
  const { slug: routeParam } = await params;
  const result = await PersonService.getPublicProfile(routeParam);
  if (!result) return { title: 'Person Not Found', robots: { index: false, follow: false } };

  const { person, canonicalPath } = result;
  const description = createPersonDescription(person.name, person.biography);

  return SeoService.generateMetadata('Person', person.id, {
    title: `${person.name} Movies, Biography & Filmography`,
    description,
    image: person.headshotUrl || undefined,
    path: canonicalPath,
    indexable: person.movies.length > 0,
    openGraphType: 'profile',
  });
}

const personDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatPersonDate(date: Date) {
  return personDateFormatter.format(date);
}

function createPersonDescription(name: string, biography: string | null) {
  const fallback = `Explore ${name}'s biography, filmography, roles, and movies available on TrailerTube.`;
  const normalized = biography?.replace(/\s+/g, ' ').trim() || fallback;

  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).trimEnd()}...`;
}
