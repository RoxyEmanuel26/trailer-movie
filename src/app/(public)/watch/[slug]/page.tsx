import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar, Clock, Star, Users, Film } from 'lucide-react';

import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { YouTubePlayer } from '@/components/public/YouTubePlayer';
import { MovieCard } from '@/components/public/MovieCard';
import { WatchProviders } from '@/components/movie/dynamic/WatchProviders';
import { MovieReviews } from '@/components/movie/dynamic/MovieReviews';
import { MovieExtraInfo } from '@/components/movie/dynamic/MovieExtraInfo';
import { MovieGallery } from '@/components/movie/dynamic/MovieGallery';
import { ResponsiveDetails } from '@/components/public/ResponsiveDetails';
import { badgeVariants } from '@/components/ui/badge';
import { personPath } from '@/lib/public-routes';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, normalizeMetaDescription } from '@/lib/site-config';
import { ORIGIN_CATALOG } from '@/lib/public-catalog';
import { EntityViewTracker } from '@/components/public/EntityViewTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await MovieService.getPublicMovie(slug);
  if (!result) notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);
  const { movie, canonicalPath } = result;
  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
  return SeoService.generateMetadata('Movie', movie.id, {
    title: `${movie.title}${year ? ` (${year})` : ''} Trailer, Cast & Where to Watch`,
    description: normalizeMetaDescription(movie.synopsis, `Watch the trailer for ${movie.title}, explore its cast and crew, and find where it is available.`),
    image: movie.backdropUrl || movie.posterUrl || undefined,
    path: canonicalPath,
  });
}

export const revalidate = 3600;

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await MovieService.getPublicMovie(slug);
  if (!result) notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);
  const { movie, canonicalPath } = result;

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

  const crewMap = new Map<
    string,
    {
      personId: string;
      person: (typeof movie.people)[0]['person'];
      roles: string[];
    }
  >();
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

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const primaryTrailer = movie.trailers.find((trailer) => trailer.status === 'ACTIVE' && trailer.sourceType === 'YOUTUBE' && trailer.isPrimary)
    || movie.trailers.find((trailer) => trailer.status === 'ACTIVE' && trailer.sourceType === 'YOUTUBE');
  const youtubeId = primaryTrailer?.sourceId || movie.youtubeTrailerId;
  const displayedReviews = (movie.movieReviews?.length ? movie.movieReviews : (movie.reviews as any[]) || []).slice(0, 5);
  const movieUrl = absoluteUrl(canonicalPath);
  const description = normalizeMetaDescription(movie.synopsis, `Watch the trailer for ${movie.title} and explore its cast, crew, and viewing information.`);
  const matchingOrigins = ORIGIN_CATALOG.filter((origin) =>
    origin.countryCodes.some((code) => movie.countries.some(({ country }) => country.isoCode === code)) ||
    origin.languageCodes.some((code) => movie.languages.some(({ language }) => language.isoCode === code))
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${movieUrl}#webpage`, url: movieUrl, name: movie.title, description, dateModified: movie.updatedAt.toISOString(), isPartOf: { '@id': `${absoluteUrl('/')}#website` }, publisher: { '@id': `${absoluteUrl('/')}#organization` }, mainEntity: { '@id': `${movieUrl}#movie` } },
      { '@type': 'BreadcrumbList', '@id': `${movieUrl}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Movies', item: absoluteUrl('/movies') },
        { '@type': 'ListItem', position: 3, name: movie.title, item: movieUrl },
      ] },
      {
        '@type': 'Movie', '@id': `${movieUrl}#movie`, url: movieUrl, name: movie.title, description, dateModified: movie.updatedAt.toISOString(),
        image: movie.posterUrl || movie.backdropUrl || undefined,
        datePublished: movie.releaseDate?.toISOString(),
        duration: movie.runtimeMinutes ? `PT${movie.runtimeMinutes}M` : undefined,
        contentRating: movie.ageRating || movie.mpaaRating || undefined,
        genre: movie.genres.map(({ genre }) => genre.name),
        director: directors.map(({ person }) => ({ '@type': 'Person', name: person.name, url: absoluteUrl(personPath(person.slug)) })),
        actor: cast.map(({ person }) => ({ '@type': 'Person', name: person.name, url: absoluteUrl(personPath(person.slug)) })),
        productionCompany: movie.companies.map(({ company }) => ({ '@type': 'Organization', name: company.name })),
        keywords: movie.keywords.map(({ keyword }) => keyword.name).join(', ') || undefined,
        aggregateRating: movie.voteAverage && movie.voteCount ? { '@type': 'AggregateRating', ratingValue: movie.voteAverage.toFixed(1), ratingCount: movie.voteCount, bestRating: 10, worstRating: 1 } : undefined,
        review: displayedReviews.map((review: any) => ({ '@type': 'Review', author: { '@type': 'Person', name: review.author }, datePublished: (review.createdAt || review.created_at) ? new Date(review.createdAt || review.created_at).toISOString() : undefined, reviewBody: review.content, reviewRating: (review.rating || review.author_details?.rating) ? { '@type': 'Rating', ratingValue: review.rating || review.author_details?.rating, bestRating: 10 } : undefined })),
        trailer: youtubeId ? { '@type': 'VideoObject', name: primaryTrailer?.title || `${movie.title} trailer`, description, thumbnailUrl: primaryTrailer?.thumbnailUrl || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`, embedUrl: `https://www.youtube.com/embed/${youtubeId}`, uploadDate: (primaryTrailer?.publishedDate || movie.releaseDate)?.toISOString() } : undefined,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <EntityViewTracker eventName="movie_view" entityId={movie.id} />

      {/* Media Player Section */}
      <section className="w-full bg-[#080908]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          {youtubeId ? (
            <YouTubePlayer videoId={youtubeId} movieId={movie.id} />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#151613]">
              <Film className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="font-medium text-white/60">Trailer not available yet</p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <div className="order-1 min-w-0 md:col-start-2 md:row-start-1">
            {movie.logoUrl ? (
              <div className="relative mb-6 h-14 w-full max-w-xs">
                <Image
                  src={movie.logoUrl}
                  alt={`${movie.title} logo`}
                  fill
                  className="object-contain object-left"
                  sizes="320px"
                />
              </div>
            ) : (
              <p className="eyebrow mb-3">Movie spotlight</p>
            )}
            <h1 className="mb-3 break-words text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              {movie.title}{' '}
              {year && <span className="font-normal text-muted-foreground">({year})</span>}
            </h1>

            {movie.tagline && (
              <p className="mb-2 max-w-2xl text-pretty text-lg italic text-muted-foreground">
                “{movie.tagline}”
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2.5 text-sm text-muted-foreground sm:gap-4">
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
                  <Link
                    key={g.genreId}
                    href={`/genre/${g.genre.slug}`}
                    className={badgeVariants({ variant: 'secondary' })}
                  >
                    {g.genre.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="order-2 max-w-none md:col-start-2 md:row-start-2 md:prose-base dark:prose-invert">
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">The story</h2>
            <p className="max-w-[68ch] text-base leading-7 text-muted-foreground sm:leading-8">
              {movie.synopsis || 'A synopsis has not been added yet.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {year ? <Link href={`/year/${year}`} className="rounded-lg border px-3 py-2 font-medium transition hover:border-primary hover:text-primary">More from {year}</Link> : null}
              {matchingOrigins.map((origin) => <Link key={origin.slug} href={`/origin/${origin.slug}`} className="rounded-lg border px-3 py-2 font-medium transition hover:border-primary hover:text-primary">{origin.label}</Link>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Catalog metadata provided by TMDB and stored locally by MovieFlix. Last updated {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(movie.updatedAt)}.</p>
          </div>

          {/* Sidebar / Poster */}
          <aside className="order-3 flex flex-col md:col-start-1 md:row-span-3 md:row-start-1">
            <div className="relative order-3 mx-auto aspect-[2/3] w-full max-w-[13rem] overflow-hidden rounded-[1.15rem] shadow-2xl ring-1 ring-black/10 sm:max-w-[17rem] md:max-w-none md:rounded-[1.35rem] dark:ring-white/10">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 639px) 208px, (max-width: 767px) 272px, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>

            <div className="order-11 md:mt-6">
              <ResponsiveDetails label="More movie details">
                {((movie.originalTitle && movie.originalTitle !== movie.title) ||
                  movie.mpaaRating ||
                  movie.companies.length > 0) && (
                  <div className="cinema-panel flex flex-col gap-4 rounded-2xl p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Info
                      </h3>
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
                              {movie.alternativeTitles
                                .slice(0, 4)
                                .map((a) => a.title)
                                .join(', ')}
                              {movie.alternativeTitles.length > 4 &&
                                ` +${movie.alternativeTitles.length - 4} more`}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}

                <MovieExtraInfo
                  budget={movie.budget}
                  revenue={movie.revenue}
                  ageRating={movie.ageRating}
                  companies={movie.companies}
                  keywords={movie.keywords}
                  countries={movie.countries}
                  languages={movie.languages}
                  originalLanguage={movie.originalLanguage}
                  productionStatus={movie.productionStatus}
                  homepage={movie.homepage}
                  imdbId={movie.imdbId}
                  movieSlug={movie.slug}
                />
              </ResponsiveDetails>
            </div>

            {(movie.watchProviders ||
              (movie.watchProviderLinks && movie.watchProviderLinks.length > 0)) && (
              <div className="order-4 md:order-none">
                <WatchProviders
                  providers={movie.watchProviders}
                  links={movie.watchProviderLinks as any}
                  movieSlug={movie.slug}
                  movieTitle={movie.title}
                />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="order-4 flex min-w-0 flex-col gap-8 md:col-start-2 md:row-start-3">
            {directors.length > 0 && (
              <div className="order-5 md:order-none">
                <h2 className="text-xl font-semibold mb-3">Directed By</h2>
                <div className="flex flex-wrap gap-4">
                  {directors.map((d) => (
                    <Link
                      href={personPath(d.person.slug)}
                      key={d.personId}
                      className="flex min-h-11 items-center gap-3 rounded-full border bg-card pl-1 pr-4 py-1 transition-colors hover:bg-muted/50"
                    >
                      {d.person.headshotUrl ? (
                        <Image
                          src={d.person.headshotUrl}
                          alt={d.person.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover w-8 h-8"
                        />
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
              <div className="order-6 md:order-none">
                <h2 className="text-xl font-semibold mb-3">Top Cast</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cast.map((c) => (
                    <Link
                      href={personPath(c.person.slug)}
                      key={c.personId}
                      className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-2 transition-colors hover:bg-muted/50"
                    >
                      {c.person.headshotUrl ? (
                        <Image
                          src={c.person.headshotUrl}
                          alt={c.person.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover w-12 h-12"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate">{c.person.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {c.characterName}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {otherCrew.length > 0 && (
              <div className="order-7 md:order-none">
                <h2 className="text-xl font-semibold mb-3">Key Crew</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {otherCrew.map((c) => (
                    <Link
                      href={personPath(c.person.slug)}
                      key={c.personId}
                      className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-2 transition-colors hover:bg-muted/50"
                    >
                      {c.person.headshotUrl ? (
                        <Image
                          src={c.person.headshotUrl}
                          alt={c.person.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover w-12 h-12"
                        />
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
              <div className="order-8 md:order-none">
                <MovieGallery images={movie.images as any} movieTitle={movie.title} />
              </div>
            )}

            {movie.collections.length > 0 && (
              <div className="order-9 mt-4 md:order-none">
                <h2 className="text-xl font-semibold mb-3">Featured In</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.collections.map((c) => (
                    <Link
                      key={c.collectionId}
                      href={`/collection/${c.collection.slug}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {c.collection.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {((movie.movieReviews && movie.movieReviews.length > 0) || movie.reviews) && (
              <div className="order-10 md:order-none">
                <MovieReviews
                  reviews={
                    movie.movieReviews && movie.movieReviews.length > 0
                      ? movie.movieReviews
                      : (movie.reviews as any[]) || []
                  }
                  movieSlug={movie.slug}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <section className="border-t bg-muted/30 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="eyebrow mb-2">Keep exploring</p>
            <h2 className="mb-7 text-3xl font-semibold tracking-[-0.04em]">You may also like</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
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
