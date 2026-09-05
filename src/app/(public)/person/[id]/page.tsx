import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Star, Film } from "lucide-react"

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      movies: {
        where: {
          movie: {
            deletedAt: null,
            status: 'PUBLISHED',
          },
        },
        include: {
          movie: {
            include: {
              genres: { include: { genre: true } },
            },
          },
        },
        orderBy: {
          movie: {
            releaseDate: 'desc',
          },
        },
      },
    },
  });

  if (!person) return notFound();

  // Top movies stored in JSON field during import (fallback/extended)
  const topMovies = Array.isArray(person.topMovies) ? person.topMovies : [];
  const rawCatalogMovies = person.movies || [];

  // Group by movie ID so a person with multiple roles in a single movie doesn't create duplicate cards or React keys
  const catalogMovieMap = new Map<string, {
    movie: (typeof rawCatalogMovies)[0]['movie'];
    roles: string[];
  }>();

  for (const m of rawCatalogMovies) {
    const existing = catalogMovieMap.get(m.movie.id);
    const roleLabel = m.roleType === 'ACTOR' && m.characterName
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": person.name,
    "description": person.biography,
    "image": person.headshotUrl,
    "gender": person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : undefined,
    "birthDate": person.birthday ? person.birthday.toISOString().split('T')[0] : undefined,
    "deathDate": person.deathday ? person.deathday.toISOString().split('T')[0] : undefined,
    "birthPlace": person.placeOfBirth,
    "jobTitle": person.knownForDepartment,
    "knowsAbout": catalogMovies.length > 0 
      ? catalogMovies.map((m) => m.movie.title) 
      : topMovies.map((m: any) => m.title),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border bg-muted">
            {person.headshotUrl ? (
              <Image
                src={person.headshotUrl}
                alt={person.name}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col gap-4 bg-muted/30 p-6 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Info</h3>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col">
                <dt className="text-muted-foreground font-medium">Known For</dt>
                <dd className="font-semibold">{person.knownForDepartment || 'N/A'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-muted-foreground font-medium">Gender</dt>
                <dd className="font-semibold">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Not specified'}</dd>
              </div>
              {person.birthday && (
                <div className="flex flex-col">
                  <dt className="text-muted-foreground font-medium">Birthdate</dt>
                  <dd className="font-semibold">{new Date(person.birthday).toLocaleDateString()} {person.deathday && ` - ${new Date(person.deathday).toLocaleDateString()}`}</dd>
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
                      className="text-primary hover:underline text-xs"
                    >
                      View IMDb Profile &rarr;
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{person.name}</h1>
          
          {person.biography && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Biography</h2>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{person.biography}</p>
              </div>
            </div>
          )}

          {/* Movies in Catalog (Clickable to our site's watch page) */}
          {catalogMovies.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">Movies in Catalog</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                  {catalogMovies.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {catalogMovies.map(({ movie, roles }) => {
                  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
                  return (
                    <Link 
                      key={movie.id} 
                      href={`/watch/${movie.slug}`} 
                      className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-card p-2 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
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
                          <span className="line-clamp-1 capitalize">
                            {roles.join(', ')}
                          </span>
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
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Known For (Movies)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {topMovies.map((m: any, idx: number) => (
                  <div key={m.id ? `${m.id}-${idx}` : idx} className="group relative flex flex-col gap-2 overflow-hidden">
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
                      <Image src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt={m.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <h3 className="line-clamp-2 font-medium text-sm leading-tight group-hover:text-primary">{m.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{m.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<import("next").Metadata> {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    select: { name: true, biography: true, headshotUrl: true }
  });
  if (!person) return { title: 'Not Found' };
  return {
    title: `${person.name} - Movies & Biography`,
    description: person.biography?.substring(0, 160) || `Learn about ${person.name}'s movies and biography.`,
    openGraph: {
      title: `${person.name} - Movies & Biography`,
      description: person.biography?.substring(0, 160) || '',
      images: person.headshotUrl ? [person.headshotUrl] : [],
    },
  };
}
