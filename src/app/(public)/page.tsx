import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clapperboard, Library, Play, Search, Star } from 'lucide-react';
import { HomepageService } from '@/lib/services/HomepageService';
import { SeoService } from '@/lib/services/SeoService';
import { SectionRenderer } from '@/components/public/SectionRenderer';
import { Button } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'home', {
    title: 'Discover what to watch next',
    description:
      'Browse popular movies, new trailers, cast, reviews, and streaming availability from one locally indexed catalog.',
    path: '/',
  });
}

export const revalidate = 3600;

export default async function HomePage() {
  const [configuredSections, featuredItems, discovery] = await Promise.all([
    HomepageService.listSections(),
    HomepageService.listFeaturedItems(),
    HomepageService.getPublicDiscoveryData(),
  ]);

  const now = new Date();
  const configuredHero = featuredItems.find(
    (item) =>
      item.isActive &&
      item.movie?.status === 'PUBLISHED' &&
      (!item.startDate || item.startDate <= now) &&
      (!item.endDate || item.endDate >= now)
  );
  const hero = configuredHero?.movie || discovery.hero;
  const heroBackdrop = configuredHero?.customBackdropUrl || hero?.backdropUrl;
  const headline = configuredHero?.customHeadline || hero?.title;
  const activeSections = configuredSections.filter((section) => section.isActive);
  const fallbackSections = [
    { id: 'fallback-trending', title: 'Trending now', type: 'AUTO_TRENDING' as const },
    { id: 'fallback-recent', title: 'Freshly added', type: 'AUTO_RECENT' as const },
    ...discovery.genres.slice(0, 2).map((genre) => ({
      id: `fallback-genre-${genre.id}`,
      title: `${genre.name}, handpicked`,
      type: 'GENRE_BASED' as const,
      genreId: genre.id,
      genre: { id: genre.id, name: genre.name, slug: genre.slug },
    })),
  ];
  const sections = activeSections.length > 0 ? activeSections : fallbackSections;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative isolate min-h-[36rem] overflow-hidden bg-[#0d0e0c] text-white sm:min-h-[42rem] lg:min-h-[46rem]">
        {heroBackdrop ? (
          <Image
            src={heroBackdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,8,.96)_0%,rgba(8,9,8,.76)_42%,rgba(8,9,8,.18)_78%),linear-gradient(0deg,rgba(8,9,8,1)_0%,transparent_48%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative mx-auto flex min-h-[36rem] max-w-[90rem] items-end px-4 pb-14 pt-20 sm:min-h-[42rem] sm:px-6 sm:pb-16 lg:min-h-[46rem] lg:px-8 lg:pb-20 lg:pt-28">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#f48a6f] sm:mb-5 sm:text-xs sm:tracking-[0.24em]">
              <Clapperboard className="h-4 w-4" /> Featured discovery
            </p>
            <h1 className="max-w-[15ch] text-balance text-[clamp(2.65rem,13vw,3.7rem)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[5.8rem]">
              {headline || 'Find your next great watch.'}
            </h1>
            {hero?.synopsis ? (
              <p className="mt-5 line-clamp-4 max-w-[62ch] text-pretty text-sm leading-6 text-white/72 sm:mt-6 sm:line-clamp-5 sm:text-base sm:leading-7 lg:line-clamp-none lg:text-lg">
                {hero.synopsis}
              </p>
            ) : (
              <p className="mt-5 line-clamp-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                Explore a growing catalog of trailers, stories, cast, and official places to watch.
              </p>
            )}

            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2.5 min-[430px]:grid-cols-2 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {hero ? (
                <Button
                  size="lg"
                  asChild
                  className="h-12 w-full rounded-xl px-6 shadow-lg shadow-primary/20 sm:w-auto"
                >
                  <Link href={`/watch/${hero.slug}`}>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Watch trailer
                  </Link>
                </Button>
              ) : null}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 w-full rounded-xl border-white/25 bg-white/8 px-6 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                <Link href="/search">
                  <Search className="mr-2 h-4 w-4" />
                  Browse catalog
                </Link>
              </Button>
            </div>

            {hero ? (
              <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-white/65 sm:mt-7 sm:gap-3 sm:text-sm">
                {hero.voteAverage ? (
                  <span className="flex items-center gap-1.5 text-white">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {hero.voteAverage.toFixed(1)}
                  </span>
                ) : null}
                {hero.releaseDate ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(hero.releaseDate).getFullYear()}</span>
                  </>
                ) : null}
                {hero.genres.slice(0, 3).map(({ genre }) => (
                  <span key={genre.id} className="rounded-md border border-white/15 px-2 py-1">
                    {genre.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-6 grid w-[calc(100%-2rem)] max-w-5xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-[#191a17] text-white shadow-2xl sm:-mt-8">
        <div className="min-w-0 p-3.5 sm:p-6 lg:p-7">
          <Library className="mb-2.5 h-4 w-4 text-[#f48a6f] sm:mb-4 sm:h-5 sm:w-5" />
          <p className="truncate text-lg font-semibold tabular-nums sm:text-3xl">
            {discovery.totalMovies.toLocaleString()}
          </p>
          <p className="mt-1 text-[0.65rem] leading-4 text-white/55 sm:text-xs">
            movies indexed locally
          </p>
        </div>
        <div className="min-w-0 border-l border-white/10 p-3.5 sm:p-6 lg:p-7">
          <Play className="mb-2.5 h-4 w-4 text-[#f48a6f] sm:mb-4 sm:h-5 sm:w-5" />
          <p className="truncate text-lg font-semibold tabular-nums sm:text-3xl">
            {discovery.trailersAvailable.toLocaleString()}
          </p>
          <p className="mt-1 text-[0.65rem] leading-4 text-white/55 sm:text-xs">
            trailers ready to play
          </p>
        </div>
        <div className="min-w-0 border-l border-white/10 p-3.5 sm:p-6 lg:p-7">
          <Clapperboard className="mb-2.5 h-4 w-4 text-[#f48a6f] sm:mb-4 sm:h-5 sm:w-5" />
          <p className="truncate text-lg font-semibold tabular-nums sm:text-3xl">
            {discovery.genres.length}
          </p>
          <p className="mt-1 text-[0.65rem] leading-4 text-white/55 sm:text-xs">popular genres</p>
        </div>
      </section>

      <div className="flex flex-col gap-1 py-8 sm:py-12">
        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="cinema-panel overflow-hidden rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="eyebrow mb-3">Browse by genre</p>
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Follow the mood, not the algorithm.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {discovery.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="rounded-xl border bg-background/60 px-3.5 py-2 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary active:scale-[.98]"
                >
                  {genre.name}{' '}
                  <span className="ml-1 text-muted-foreground tabular-nums">
                    {genre._count.movies.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
