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
import { moviesLikePath, personPath } from '@/lib/public-routes';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  absoluteUrl,
  normalizeMetaDescription,
  organizationSchemaId,
  websiteSchemaId,
} from '@/lib/site-config';
import { buildWatchMetaTitle } from '@/lib/seo-metadata';
import { ORIGIN_CATALOG } from '@/lib/public-catalog';
import { getOriginAdjective } from '@/lib/programmatic-guides';
import { cleanFranchiseName } from '@/lib/franchise-guides';
import { isEligibleForMoviesLikeIndex, MOVIES_LIKE_MIN_VOTES } from '@/lib/movies-like';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';
import { EntityViewTracker } from '@/components/public/EntityViewTracker';
import { trailerSchema } from '@/lib/trailer-schema';
import { ShareMovieButton } from '@/components/public/ShareMovieButton';
import { extractYouTubeId } from '@/lib/utils/youtube';
import { MovieQuickFactsFaq } from '@/components/movie/MovieQuickFactsFaq';
import {
  buildFaqJsonLd,
  buildMovieQuickFactsAndFaq,
  extractUniqueProviders,
} from '@/lib/movie-aeo';

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
    title: buildWatchMetaTitle(movie.title, year),
    description: normalizeMetaDescription(movie.synopsis, `Watch the trailer for ${movie.title}, explore its cast and crew, and find where it is available.`),
    image: `${canonicalPath}/opengraph-image`,
    path: canonicalPath,
    indexable: movie.importQualityStatus === 'READY',
  });
}

export const revalidate = 3600;

// Generate movie pages on first visit and reuse the result until revalidation.
// Returning no build-time paths avoids a database-heavy production build.
export async function generateStaticParams() {
  return [];
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await MovieService.getPublicMovie(slug);
  if (!result) notFound();
  if (result.shouldRedirect) permanentRedirect(result.canonicalPath);
  const { movie, canonicalPath } = result;

  const genreIds = movie.genres.map((g) => g.genreId);
  const canCheckMoviesLike =
    movie.importQualityStatus === 'READY' && (movie.voteCount ?? 0) >= MOVIES_LIKE_MIN_VOTES;
  const [relatedMovies, facetGuides, directRecCount] = await Promise.all([
    MovieService.getRelatedMovies(movie.id, genreIds),
    MovieService.getIndexableFacetGuides().catch(() => null),
    canCheckMoviesLike
      ? MovieService.countPublishedDirectRecommendations(movie.id).catch(() => 0)
      : Promise.resolve(0),
  ]);
  const hasMoviesLikeGuide = isEligibleForMoviesLikeIndex({
    importQualityStatus: movie.importQualityStatus,
    voteCount: movie.voteCount,
    recommendationCount: directRecCount,
  });

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

  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
  const primaryTrailer = movie.trailers.find((trailer) => trailer.status === 'ACTIVE' && trailer.sourceType === 'YOUTUBE' && trailer.isPrimary)
    || movie.trailers.find((trailer) => trailer.status === 'ACTIVE' && trailer.sourceType === 'YOUTUBE');
  const youtubeId =
    extractYouTubeId(primaryTrailer?.sourceId || '') ||
    extractYouTubeId(movie.youtubeTrailerId || '');
  const legacyReviews = Array.isArray(movie.reviews)
    ? movie.reviews.filter((review) => Boolean(review && typeof review === 'object'))
    : [];
  const resolvedReviews =
    movie.movieReviews && movie.movieReviews.length > 0 ? movie.movieReviews : legacyReviews;
  const movieUrl = absoluteUrl(canonicalPath);
  const description = normalizeMetaDescription(movie.synopsis, `Watch the trailer for ${movie.title} and explore its cast, crew, and viewing information.`);
  const matchingOrigins = ORIGIN_CATALOG.filter((origin) =>
    origin.countryCodes.some((code) => movie.countries.some(({ country }) => country.isoCode === code)) ||
    origin.languageCodes.some((code) => movie.languages.some(({ language }) => language.isoCode === code))
  );
  const { names: providerNames, hubLinks } = extractUniqueProviders(
    movie.watchProviderLinks as any,
    movie.watchProviders,
  );
  const { quickSummary, faqs } = buildMovieQuickFactsAndFaq({
    title: movie.title,
    year,
    releaseDate: movie.releaseDate,
    runtimeMinutes: movie.runtimeMinutes,
    ageRating: movie.ageRating,
    mpaaRating: movie.mpaaRating,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    genres: movie.genres.map(({ genre }) => genre.name),
    directors: directors.map(({ person }) => person.name),
    cast: cast.map((c) => ({ name: c.person.name, characterName: c.characterName })),
    countries: movie.countries.map(({ country }) => country.name),
    languages: movie.languages.map(({ language }) => language.name),
    hasActiveTrailer: Boolean(youtubeId),
    providerNames,
  });
  const faqSchema = buildFaqJsonLd(movieUrl, faqs);
  const primaryGenre = movie.genres[0]?.genre || null;
  const activeCollections = movie.collections.filter(
    (c) => c.collection.isActive && Boolean(c.collection.slug?.trim()),
  );
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    ...(primaryGenre ? [{ name: primaryGenre.name, path: `/genre/${primaryGenre.slug}` }] : []),
    { name: movie.title, path: canonicalPath },
  ];
  const sameAs = [
    movie.imdbId && /^tt\d+$/.test(movie.imdbId.trim())
      ? `https://www.imdb.com/title/${movie.imdbId.trim()}/`
      : null,
    movie.tmdbId ? `https://www.themoviedb.org/movie/${movie.tmdbId}` : null,
  ].filter((value): value is string => Boolean(value));
  const alternateName =
    movie.originalTitle?.trim() &&
    movie.originalTitle.trim().toLowerCase() !== movie.title.trim().toLowerCase()
      ? movie.originalTitle.trim()
      : undefined;
  const countryOfOrigin = movie.countries.length
    ? movie.countries.map(({ country }) => ({ '@type': 'Country', name: country.name }))
    : undefined;
  const inLanguage = movie.languages.length
    ? movie.languages.map(({ language }) => language.name)
    : movie.originalLanguage || undefined;

  const contextualGuideLinks: Array<{ href: string; label: string }> = [];
  if (primaryGenre && facetGuides) {
    if (
      year &&
      facetGuides.genreYear.some(
        (entry) => entry.genreSlug === primaryGenre.slug && entry.year === year,
      )
    ) {
      contextualGuideLinks.push({
        href: `/genre/${primaryGenre.slug}/${year}`,
        label: `${year} ${primaryGenre.name} movies`,
      });
    }
    for (const hub of hubLinks.slice(0, 2)) {
      if (
        facetGuides.streamingGenre.some(
          (entry) => entry.streamingSlug === hub.slug && entry.genreSlug === primaryGenre.slug,
        )
      ) {
        contextualGuideLinks.push({
          href: `/streaming/${hub.slug}/${primaryGenre.slug}`,
          label: `${primaryGenre.name} on ${hub.name}`,
        });
      }
    }
    const firstOrigin = matchingOrigins[0];
    if (
      firstOrigin &&
      facetGuides.originGenre.some(
        (entry) => entry.originSlug === firstOrigin.slug && entry.genreSlug === primaryGenre.slug,
      )
    ) {
      contextualGuideLinks.push({
        href: `/origin/${firstOrigin.slug}/${primaryGenre.slug}`,
        label: `${getOriginAdjective(firstOrigin)} ${primaryGenre.name} movies`,
      });
    }
  }

  const titleWithYear = year ? `${movie.title} (${year})` : movie.title;
  const seenImageUrls = new Set<string>();
  const movieImageObjects: Array<Record<string, unknown>> = [];
  const pushImageObject = (
    rawUrl: string | null | undefined,
    widthTier: number,
    caption: string,
    dims?: { width?: number | null; height?: number | null },
  ) => {
    if (!rawUrl?.trim()) return;
    const resolved = getTmdbImageUrl(rawUrl.trim(), widthTier);
    if (!resolved || seenImageUrls.has(resolved)) return;
    seenImageUrls.add(resolved);
    movieImageObjects.push({
      '@type': 'ImageObject',
      url: resolved,
      contentUrl: resolved,
      caption,
      ...(dims?.width && dims.width > 0 ? { width: dims.width } : {}),
      ...(dims?.height && dims.height > 0 ? { height: dims.height } : {}),
    });
  };

  pushImageObject(movie.posterUrl, 780, `${titleWithYear} Official Movie Poster`);
  pushImageObject(movie.backdropUrl, 1280, `${titleWithYear} Official HD Wallpaper`);
  const gallerySchemaImages = (movie.images || [])
    .filter((img) => img.imageType === 'BACKDROP' || img.imageType === 'POSTER')
    .slice(0, 6);
  gallerySchemaImages.forEach((img, idx) => {
    const isPoster = img.imageType === 'POSTER';
    pushImageObject(
      img.imageUrl,
      isPoster ? 780 : 1280,
      isPoster
        ? `${titleWithYear} Official Movie Poster ${idx + 1}`
        : `${titleWithYear} Official HD Wallpaper & Still ${idx + 1}`,
      { width: img.width, height: img.height },
    );
  });

  const watchAction =
    hubLinks.length > 0
      ? {
          '@type': 'WatchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${movieUrl}#watch-providers`,
            inLanguage: 'en',
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
            ],
          },
          expectsAcceptanceOf: {
            '@type': 'Offer',
            category: 'subscription',
            availabilityStarts: movie.releaseDate?.toISOString(),
          },
        }
      : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${movieUrl}#webpage`,
        url: movieUrl,
        name: movie.title,
        description,
        dateModified: movie.updatedAt.toISOString(),
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': `${movieUrl}#movie` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${movieUrl}#breadcrumb`,
        itemListElement: breadcrumbItems.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      },
      {
        '@type': 'Movie',
        '@id': `${movieUrl}#movie`,
        url: movieUrl,
        name: movie.title,
        alternateName,
        description,
        dateModified: movie.updatedAt.toISOString(),
        image:
          movieImageObjects.length > 1
            ? movieImageObjects
            : movieImageObjects[0] || movie.posterUrl || movie.backdropUrl || undefined,
        datePublished: movie.releaseDate?.toISOString(),
        duration: movie.runtimeMinutes ? `PT${movie.runtimeMinutes}M` : undefined,
        contentRating: movie.ageRating || movie.mpaaRating || undefined,
        countryOfOrigin,
        inLanguage,
        sameAs: sameAs.length ? sameAs : undefined,
        genre: movie.genres.map(({ genre }) => genre.name),
        director: directors.map(({ person }) => ({ '@type': 'Person', '@id': `${absoluteUrl(personPath(person.slug))}#person`, name: person.name, url: absoluteUrl(personPath(person.slug)) })),
        actor: cast.map(({ person }) => ({ '@type': 'Person', '@id': `${absoluteUrl(personPath(person.slug))}#person`, name: person.name, url: absoluteUrl(personPath(person.slug)) })),
        productionCompany: movie.companies.map(({ company }) => ({ '@type': 'Organization', name: company.name })),
        keywords: movie.keywords.map(({ keyword }) => keyword.name).join(', ') || undefined,
        ...(watchAction ? { potentialAction: watchAction } : {}),
        trailer: trailerSchema({
          videoId: youtubeId,
          movieTitle: movie.title,
          year,
          title: primaryTrailer?.title || `${movie.title} Official Trailer`,
          description,
          thumbnailUrl: primaryTrailer?.thumbnailUrl,
          publishedDate: primaryTrailer?.publishedDate,
          isFamilyFriendly: !movie.adult,
          inLanguage: movie.originalLanguage,
        }),
      },
      ...(faqSchema ? [faqSchema] : []),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <EntityViewTracker eventName="movie_view" entityId={movie.id} />

      {/* Media Player Section */}
      <section className="w-full bg-[#080908]">
        <div className="mx-auto max-w-7xl py-0 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {youtubeId ? (
            <YouTubePlayer
              videoId={youtubeId}
              movieId={movie.id}
              movieTitle={movie.title}
              backdropUrl={movie.backdropUrl}
              className="rounded-none sm:rounded-xl"
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center border border-white/10 bg-[#151613] sm:rounded-2xl">
              <Film className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="font-medium text-white/60">Trailer not available yet</p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground sm:mb-8"
        >
          {breadcrumbItems.map((item, index) => (
            <span key={item.path} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === breadcrumbItems.length - 1 ? (
                <span aria-current="page" className="truncate text-foreground">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} prefetch={false} className="transition-colors hover:text-primary">
                  {item.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-10">
          <div className="order-1 min-w-0 lg:col-start-2 lg:row-start-1">
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
            <h1 className="mb-3 break-words text-balance text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
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
                  <span>
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(movie.releaseDate))}
                  </span>
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
                    prefetch={false}
                    className={badgeVariants({ variant: 'secondary' })}
                  >
                    {g.genre.name}
                  </Link>
                ))}
              </div>
            </div>

            <ShareMovieButton title={movie.title} year={year} url={movieUrl} />
          </div>

          <div className="order-2 max-w-none lg:col-start-2 lg:row-start-2 lg:prose-base dark:prose-invert">
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">The story</h2>
            <p className="max-w-[68ch] text-base leading-7 text-muted-foreground sm:leading-8">
              {movie.synopsis || 'A synopsis has not been added yet.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {year ? <Link href={`/year/${year}`} prefetch={false} className="rounded-lg border px-3 py-2 font-medium transition hover:border-primary hover:text-primary">More from {year}</Link> : null}
              {matchingOrigins.map((origin) => <Link key={origin.slug} href={`/origin/${origin.slug}`} prefetch={false} className="rounded-lg border px-3 py-2 font-medium transition hover:border-primary hover:text-primary">{origin.label}</Link>)}
              {hubLinks.slice(0, 4).map((hub) => <Link key={hub.slug} href={`/streaming/${hub.slug}`} prefetch={false} className="rounded-lg border px-3 py-2 font-medium transition hover:border-primary hover:text-primary">On {hub.name}</Link>)}
              {contextualGuideLinks.map((guide) => (
                <Link key={guide.href} href={guide.href} prefetch={false} className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 font-medium text-foreground transition hover:border-primary hover:text-primary">
                  {guide.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar / Poster */}
          <aside className="order-3 flex flex-col lg:col-start-1 lg:row-span-3 lg:row-start-1">
            <div className="relative order-3 mx-auto aspect-[2/3] w-full max-w-[10rem] overflow-hidden rounded-[1.15rem] shadow-2xl ring-1 ring-black/10 sm:max-w-[14rem] lg:max-w-none lg:rounded-[1.35rem] dark:ring-white/10">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  priority={!youtubeId}
                  sizes="(max-width: 639px) 160px, (max-width: 1023px) 224px, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>

            <div className="order-11 mt-4 sm:mt-5 lg:mt-6">
              <ResponsiveDetails label="More movie details">
                {((movie.originalTitle && movie.originalTitle !== movie.title) ||
                  movie.mpaaRating ||
                  (movie.alternativeTitles && movie.alternativeTitles.length > 0)) && (
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
                  homepage={movie.homepage}
                />
              </ResponsiveDetails>
            </div>

            {(movie.watchProviders ||
              (movie.watchProviderLinks && movie.watchProviderLinks.length > 0)) && (
              <div id="watch-providers" className="order-4 mt-5 scroll-mt-24">
                <WatchProviders
                  providers={movie.watchProviderLinks?.length ? undefined : movie.watchProviders}
                  links={movie.watchProviderLinks as any}
                  movieSlug={movie.slug}
                  movieTitle={movie.title}
                />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="order-4 flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-3">
            {directors.length > 0 && (
              <div className="order-5 lg:order-none">
                <h2 className="text-xl font-semibold mb-3">Directed By</h2>
                <div className="flex flex-wrap gap-4">
                  {directors.map((d) => (
                    <Link
                      href={personPath(d.person.slug)}
                      prefetch={false}
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
              <div className="order-6 lg:order-none">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h2 className="text-xl font-semibold">Top Cast</h2>
                  <span className="text-xs text-muted-foreground sm:hidden">Swipe to explore</span>
                </div>
                <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                  {cast.map((c) => (
                    <Link
                      href={personPath(c.person.slug)}
                      prefetch={false}
                      key={c.personId}
                      className="flex min-h-16 w-[78vw] max-w-[18rem] shrink-0 snap-start items-center gap-3 rounded-xl border bg-card p-2 transition-colors hover:bg-muted/50 sm:w-auto sm:max-w-none"
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
              <div className="order-7 lg:order-none">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h2 className="text-xl font-semibold">Key Crew</h2>
                  <span className="text-xs text-muted-foreground sm:hidden">Swipe to explore</span>
                </div>
                <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                  {otherCrew.map((c) => (
                    <Link
                      href={personPath(c.person.slug)}
                      prefetch={false}
                      key={c.personId}
                      className="flex min-h-16 w-[78vw] max-w-[18rem] shrink-0 snap-start items-center gap-3 rounded-xl border bg-card p-2 transition-colors hover:bg-muted/50 sm:w-auto sm:max-w-none"
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
              <div className="order-8 lg:order-none">
                <MovieGallery images={movie.images as any} movieTitle={movie.title} releaseYear={year} />
              </div>
            )}

            {activeCollections.length > 0 && (
              <div className="order-9 mt-4 lg:order-none">
                <h2 className="text-xl font-semibold mb-3">Franchise Watch Order</h2>
                <div className="flex flex-wrap gap-2">
                  {activeCollections.map((c) => (
                    <Link
                      key={c.collectionId}
                      href={`/collection/${c.collection.slug}`}
                      prefetch={false}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
                    >
                      <span>{cleanFranchiseName(c.collection.title)} — Watch Order</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {resolvedReviews.length > 0 && (
              <div className="order-10 lg:order-none">
                <MovieReviews
                  reviews={resolvedReviews as any[]}
                  movieSlug={movie.slug}
                />
              </div>
            )}

            <div className="order-11 lg:order-none">
              <MovieQuickFactsFaq
                movieTitle={movie.title}
                quickSummary={quickSummary}
                faqs={faqs}
                streamingHubLinks={hubLinks}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Related Movies */}
      {relatedMovies.length > 0 && (
        <section className="border-t bg-muted/30 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Keep exploring</p>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">You may also like</h2>
              </div>
              {hasMoviesLikeGuide ? (
                <Link
                  href={moviesLikePath(movie.slug)}
                  prefetch={false}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/35 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
                >
                  <span>Full comparison: Movies like {movie.title}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
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
