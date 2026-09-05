import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Star, Users, Film } from 'lucide-react';

import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { YouTubePlayer } from '@/components/public/YouTubePlayer';
import { MovieCard } from '@/components/public/MovieCard';
import { WatchProviders } from "@/components/movie/dynamic/WatchProviders"
import { MovieReviews } from "@/components/movie/dynamic/MovieReviews"
import { MovieExtraInfo } from "@/components/movie/dynamic/MovieExtraInfo"
import { MovieGallery } from "@/components/movie/dynamic/MovieGallery"
import { badgeVariants } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const movie = await MovieService.getBySlug(slug);
    return SeoService.generateMetadata('Movie', movie.id, {
      title: `${movie.title} Trailer`,
      description: movie.synopsis || `Watch the trailer for ${movie.title}`,
      image: movie.backdropUrl || movie.posterUrl || undefined,
      path: `/watch/${movie.slug}`,
    });
  } catch (error) {
    return { title: 'Not Found' };
  }
}

export const revalidate = 3600;

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let movie;
  try {
    movie = await MovieService.getBySlug(slug);
  } catch (error) {
    notFound();
  }

  const genreIds = movie.genres.map((g) => g.genreId);
  const relatedMovies = await MovieService.getRelatedMovies(movie.id, genreIds);

  // Deduplicate and group crew members by personId to prevent duplicate React keys
  const directorMap = new Map<string, (typeof movie.people)[0]>();
  for (const d of movie.people) {
    if (d.roleType === 'DIRECTOR' && !directorMap.has(d.personId)) {
      directorMap.set(d.personId, d);
    }
  }
  const directors = Array.from(directorMap.values());

  const castMap = new Map<string, (typeof movie.people)[0]>();
  for (const c of movie.people) {
    if (c.roleType === 'ACTOR' && !castMap.has(c.personId)) {
      castMap.set(c.personId, c);
    }
  }
  const cast = Array.from(castMap.values());

  const crewMap = new Map<string, {
    personId: string;
    person: (typeof movie.people)[0]['person'];
    roles: string[];
  }>();
  for (const p of movie.people) {
    if (['WRITER', 'COMPOSER', 'CINEMATOGRAPHER', 'EDITOR'].includes(p.roleType)) {
      const roleLabel = p.roleType.toLowerCase().replace('_', ' ');
      const existing = crewMap.get(p.personId);
      if (existing) {
        if (!existing.roles.includes(roleLabel)) {
          existing.roles.push(roleLabel);
        }
      } else {
        crewMap.set(p.personId, {
          personId: p.personId,
          person: p.person,
          roles: [roleLabel],
        });
      }
    }
  }
  const otherCrew = Array.from(crewMap.values());

  const jsonLd = SeoService.generateStructuredData('Movie', {
    title: movie.title,
    description: movie.synopsis,
    image: movie.posterUrl,
    releaseDate: movie.releaseDate,
    directors: directors.map((d) => ({ name: d.person.name })),
    actors: cast.map((a) => ({ name: a.person.name })),
    genre: movie.genres[0]?.genre,
    youtubeTrailerId: movie.youtubeTrailerId,
    path: `/watch/${movie.slug}`,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
  });

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* Media Player Section */}
      <section className="bg-black w-full border-b">
        <div className="container mx-auto max-w-6xl py-8 px-4">
          {movie.youtubeTrailerId ? (
            <YouTubePlayer 
              videoId={movie.youtubeTrailerId} 
              movieId={movie.id}
              autoplay={true}
            />
          ) : (
            <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center rounded-lg border border-border">
              <Film className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">Coming Soon Trailer</p>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
            
            {((movie.originalTitle && movie.originalTitle !== movie.title) || 
              movie.mpaaRating || 
              movie.companies.length > 0) && (
              <div className="mt-6 flex flex-col gap-4 bg-muted/30 p-6 rounded-xl border">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Info</h3>
                  <dl className="space-y-2 text-sm">
                    {movie.originalTitle && movie.originalTitle !== movie.title && (
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Original Title</dt>
                        <dd className="font-medium">{movie.originalTitle}</dd>
                      </div>
                    )}
                    {movie.mpaaRating && (
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Rating</dt>
                        <dd className="font-medium">{movie.mpaaRating}</dd>
                      </div>
                    )}
                    {movie.companies.length > 0 && (
                      <div className="flex flex-col mt-2">
                        <dt className="text-muted-foreground">Studios</dt>
                        <dd className="font-medium">
                          {movie.companies.map((c) => c.company.name).join(', ')}
                        </dd>
                      </div>
                    )}
                    {movie.alternativeTitles && movie.alternativeTitles.length > 0 && (
                      <div className="flex flex-col mt-2">
                        <dt className="text-muted-foreground">Also Known As</dt>
                        <dd className="font-medium text-xs text-muted-foreground line-clamp-2">
                          {movie.alternativeTitles.slice(0, 4).map(a => a.title).join(', ')}
                          {movie.alternativeTitles.length > 4 && ` +${movie.alternativeTitles.length - 4} more`}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
            
            {(movie.watchProviders || (movie.watchProviderLinks && movie.watchProviderLinks.length > 0)) && (
              <WatchProviders 
                providers={movie.watchProviders} 
                links={movie.watchProviderLinks as any} 
                movieSlug={movie.slug} 
                movieTitle={movie.title}
              />
            )}

            <MovieExtraInfo 
              budget={movie.budget} 
              revenue={movie.revenue} 
              ageRating={movie.ageRating}
              companies={movie.companies}
              keywords={movie.keywords}
              movieSlug={movie.slug} 
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                {movie.title} {year && <span className="text-muted-foreground font-normal">({year})</span>}
              </h1>

              {movie.tagline && (
                <p className="italic text-muted-foreground text-lg mb-2">"{movie.tagline}"</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                {movie.voteAverage ? (
                  <div className="flex items-center gap-1.5 font-semibold text-foreground bg-muted/60 px-2.5 py-1 rounded-md border text-sm">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>{movie.voteAverage.toFixed(1)}</span>
                    {movie.voteCount ? (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({movie.voteCount.toLocaleString()} votes)
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {movie.releaseDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {movie.runtimeMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.runtimeMinutes} min</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {movie.genres.map((g) => (
                    <Link key={g.genreId} href={`/genre/${g.genre.slug}`} className={badgeVariants({ variant: "secondary" })}>
                      {g.genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
              <p>{movie.synopsis || "No synopsis available."}</p>
            </div>

            {directors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Directed By</h2>
                <div className="flex flex-wrap gap-4">
                  {directors.map((d) => (
                    <Link href={`/person/${d.personId}`} key={d.personId} className="flex items-center gap-3 bg-card border rounded-full pl-1 pr-4 py-1 hover:bg-muted/50 transition-colors">
                      {d.person.headshotUrl ? (
                        <Image src={d.person.headshotUrl} alt={d.person.name} width={32} height={32} className="rounded-full object-cover w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{d.person.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {cast.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Top Cast</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cast.map((c) => (
                    <Link href={`/person/${c.personId}`} key={c.personId} className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      {c.person.headshotUrl ? (
                        <Image src={c.person.headshotUrl} alt={c.person.name} width={48} height={48} className="rounded-md object-cover w-12 h-12" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{c.person.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{c.characterName}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {otherCrew.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Key Crew</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {otherCrew.map((c) => (
                    <Link href={`/person/${c.personId}`} key={c.personId} className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      {c.person.headshotUrl ? (
                        <Image src={c.person.headshotUrl} alt={c.person.name} width={48} height={48} className="rounded-md object-cover w-12 h-12" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{c.person.name}</span>
                        <span className="text-xs text-muted-foreground capitalize truncate">
                          {c.roles.join(', ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {movie.images && movie.images.length > 0 && (
              <MovieGallery images={movie.images as any} />
            )}
            
            {movie.collections.length > 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-3">Featured In</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.collections.map((c) => (
                    <Link key={c.collectionId} href={`/collection/${c.collection.slug}`} className="text-primary hover:underline font-medium">
                      {c.collection.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {((movie.movieReviews && movie.movieReviews.length > 0) || movie.reviews) && (
              <MovieReviews 
                reviews={(movie.movieReviews && movie.movieReviews.length > 0) ? movie.movieReviews : ((movie.reviews as any[]) || [])} 
                movieSlug={movie.slug} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <section className="bg-muted/30 border-t py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold tracking-tight mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedMovies.map((rm) => (
                <MovieCard key={rm.id} movie={rm} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
