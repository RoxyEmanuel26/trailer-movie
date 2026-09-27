import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clapperboard, Play, Search, Star } from 'lucide-react';
import { HomepageService } from '@/lib/services/HomepageService';
import { SeoService } from '@/lib/services/SeoService';
import { SectionRenderer } from '@/components/public/SectionRenderer';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { moviePath } from '@/lib/public-routes';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';

const homepageTitle = 'MovieFlix: Movie Trailers, Cast & Where to Watch';
const homepageDescription =
  'Discover new and popular movies, watch trailers, explore cast and crew, and find official streaming, rental and purchase options on MovieFlix.';

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await HomepageService.getSmartHomepageData();
  const image = absoluteUrl('/opengraph-image');
  const metadata = await SeoService.generateMetadata('Page', 'home', {
    title: homepageTitle,
    description: homepageDescription,
    image,
    path: '/',
  });
  return {
    ...metadata,
    title: { absolute: homepageTitle },
    description: homepageDescription,
    openGraph: {
      ...metadata.openGraph,
      title: homepageTitle,
      description: homepageDescription,
      images: [{ url: image, width: 1200, height: 630, alt: homepage.hero ? `${homepage.hero.title} on MovieFlix` : 'MovieFlix movie discovery' }],
    },
    twitter: {
      ...metadata.twitter,
      title: homepageTitle,
      description: homepageDescription,
      images: [image],
    },
  };
}

export const revalidate = 300;

export default async function HomePage() {
  const discovery = await HomepageService.getSmartHomepageData();
  const { hero, heroBackdrop, heroHeadline: headline, sections } = discovery;
  const primaryImage = heroBackdrop ? getTmdbImageUrl(heroBackdrop, 1280) : absoluteUrl('/opengraph-image');

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url, logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/movieflix-icon-512.png'), width: 512, height: 512 }, ...(siteConfig.contactEmail ? { email: siteConfig.contactEmail } : {}) },
          { '@type': 'WebSite', '@id': `${siteConfig.url}#website`, name: siteConfig.name, url: siteConfig.url, publisher: { '@id': `${siteConfig.url}#organization` }, potentialAction: { '@type': 'SearchAction', target: absoluteUrl('/search?q={search_term_string}'), 'query-input': 'required name=search_term_string' } },
          { '@type': 'WebPage', '@id': `${siteConfig.url}#webpage`, url: siteConfig.url, name: homepageTitle, isPartOf: { '@id': `${siteConfig.url}#website` }, description: homepageDescription, primaryImageOfPage: { '@type': 'ImageObject', url: primaryImage } },
          { '@type': 'ItemList', '@id': `${siteConfig.url}#trending`, name: 'Trending movies on MovieFlix', numberOfItems: discovery.trending.length, itemListElement: discovery.trending.map((movie, index) => ({ '@type': 'ListItem', position: index + 1, url: absoluteUrl(moviePath(movie.slug)), name: movie.title })) },
        ],
      }} />
      <section className="relative isolate min-h-[36rem] overflow-hidden bg-[#0d0e0c] text-white sm:min-h-[42rem] lg:min-h-[46rem]">
        {heroBackdrop ? (
          <Image
            src={heroBackdrop}
            alt={hero ? `${hero.title} movie backdrop` : 'MovieFlix featured movie'}
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
            <h1 className="max-w-[17ch] text-balance text-[clamp(2.55rem,12vw,3.6rem)] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[5.4rem]">
              Discover movies, trailers and where to watch
            </h1>
            {headline ? <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Featured: {headline}</h2> : null}
            {hero?.synopsis ? (
              <p className="mt-5 line-clamp-4 max-w-[62ch] text-pretty text-sm leading-6 text-white/72 sm:mt-6 sm:line-clamp-5 sm:text-base sm:leading-7 lg:line-clamp-none lg:text-lg">
                {hero.synopsis}
              </p>
            ) : (
              <p className="mt-5 line-clamp-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                Explore MovieFlix for trailers, stories, cast, and official places to watch.
              </p>
            )}

            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2.5 min-[430px]:grid-cols-2 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {hero ? (
                <Button
                  size="lg"
                  asChild
                  className="h-12 w-full rounded-xl px-6 shadow-lg shadow-primary/20 sm:w-auto"
                >
                  <Link href={moviePath(hero.slug)}>
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
                <Link href="/movies">
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
                    {genre._count.movies.toLocaleString('en-US')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 pb-8 pt-3 sm:px-6 sm:pb-12 lg:px-8">
        <div className="grid gap-4 border-t pt-7 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {[
            { href: '/movies', title: 'Explore all movies', text: 'Browse the newest releases first, then filter the catalog by what matters to you.' },
            { href: '/popular', title: 'See what is popular', text: 'Find audience favorites, highly rated movies and current releases.' },
            { href: '/countries', title: 'Discover by origin', text: 'Explore movies through production countries and spoken languages.' },
            { href: '/years', title: 'Browse by year', text: 'Travel through recent releases and earlier eras of cinema.' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border bg-card/55 p-4 transition hover:border-primary/35 hover:bg-card sm:p-5">
              <h2 className="font-semibold tracking-[-0.02em] group-hover:text-primary">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
