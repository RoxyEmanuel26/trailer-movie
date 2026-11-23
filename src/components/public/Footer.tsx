import Link from 'next/link';
import { MovieFlixLogo } from '@/components/brand/MovieFlixLogo';
import { AnalyticsPreferencesButton } from './AnalyticsPreferencesButton';
import { MovieService } from '@/lib/services/MovieService';

export async function Footer() {
  const currentYear = new Date().getUTCFullYear();
  const facetGuides = await MovieService.getIndexableFacetGuides().catch(() => null);
  const latestActionYear = facetGuides?.genreYear
    .filter((entry) => entry.genreSlug === 'action')
    .sort((a, b) => b.year - a.year)[0]?.year;
  const latestHorrorYear = facetGuides?.genreYear
    .filter((entry) => entry.genreSlug === 'horror')
    .sort((a, b) => b.year - a.year)[0]?.year;

  return (
    <footer className="mt-12 border-t border-white/10 bg-muted/30 py-10 sm:mt-16 sm:py-12">
      <div className="mx-auto grid max-w-[90rem] grid-cols-2 gap-x-6 gap-y-9 px-4 sm:px-6 md:grid-cols-[1.35fr_1fr_1fr_1fr] md:gap-10 lg:px-8">
        <div className="col-span-2 flex max-w-md flex-col gap-4 md:col-span-1">
          <Link href="/" className="flex items-center space-x-2">
            <MovieFlixLogo markClassName="h-8 w-8" wordmarkClassName="text-lg" />
          </Link>
          <p className="text-sm text-muted-foreground">
            MovieFlix brings trailers, stories, cast, ratings, and official viewing options together
            in one focused discovery experience.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm">Discover</h3>
          <ul className="flex flex-col text-sm text-muted-foreground">
            <li>
              <Link
                href="/movies"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                All Movies
              </Link>
            </li>
            <li>
              <Link
                href="/upcoming"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Upcoming Releases
              </Link>
            </li>
            <li>
              <Link
                href="/tonight"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Movie Night Picker
              </Link>
            </li>
            <li>
              <Link
                href="/watchlist"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                My Watchlist
              </Link>
            </li>
            <li>
              <Link
                href="/popular"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Popular &amp; Top Rated
              </Link>
            </li>
            <li>
              <Link
                href="/collections"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Franchises in Order
              </Link>
            </li>
            <li>
              <Link
                href="/studios"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Film Studios
              </Link>
            </li>
            <li>
              <Link
                href="/themes"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Themes &amp; Tropes
              </Link>
            </li>
            <li>
              <Link
                href="/movies/under-90-minutes"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Movies Under 90 Min
              </Link>
            </li>
            <li>
              <Link
                href="/streaming"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Streaming services
              </Link>
            </li>
            <li>
              <Link
                href="/genres"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Movie genres
              </Link>
            </li>
            <li>
              <Link
                href="/countries"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Countries &amp; languages
              </Link>
            </li>
            <li>
              <Link
                href="/years"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Release years
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm">Popular guides</h3>
          <ul className="flex flex-col text-sm text-muted-foreground">
            <li>
              <Link
                href="/streaming/netflix"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Movies on Netflix
              </Link>
            </li>
            <li>
              <Link
                href="/streaming/netflix/action"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Action on Netflix
              </Link>
            </li>
            <li>
              <Link
                href="/streaming/netflix/horror"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Horror on Netflix
              </Link>
            </li>
            <li>
              <Link
                href={latestActionYear ? `/genre/action/${latestActionYear}` : '/genre/action'}
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                {latestActionYear ? `${latestActionYear} Action movies` : 'Action movies'}
              </Link>
            </li>
            <li>
              <Link
                href={latestHorrorYear ? `/genre/horror/${latestHorrorYear}` : '/genre/horror'}
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                {latestHorrorYear ? `${latestHorrorYear} Horror movies` : 'Horror movies'}
              </Link>
            </li>
            <li>
              <Link
                href="/origin/south-korea-korean/thriller"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Korean thriller movies
              </Link>
            </li>
            <li>
              <Link
                href="/streaming/sky"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Movies on Sky
              </Link>
            </li>
            <li>
              <Link
                href="/origin/spain-spanish"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Spanish movies
              </Link>
            </li>
            <li>
              <Link
                href="/origin/nordic"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Nordic cinema
              </Link>
            </li>
            <li>
              <Link
                href="/studio/a24"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                A24 movies
              </Link>
            </li>
            <li>
              <Link
                href="/studio/toho"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                TOHO movies
              </Link>
            </li>
            <li>
              <Link
                href="/theme/time-travel"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Time travel movies
              </Link>
            </li>
            <li>
              <Link
                href="/theme/based-on-true-story"
                prefetch={false}
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Based on a true story
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm">MovieFlix</h3>
          <ul className="flex flex-col text-sm text-muted-foreground">
            <li><Link href="/about" className="flex min-h-11 items-center hover:text-foreground">About</Link></li>
            <li><Link href="/methodology" className="flex min-h-11 items-center hover:text-foreground">Methodology</Link></li>
            <li><Link href="/about#data-attribution" className="flex min-h-11 items-center hover:text-foreground">Data credits</Link></li>
            <li><Link href="/contact" className="flex min-h-11 items-center hover:text-foreground">Contact</Link></li>
            <li>
              <Link href="/privacy" className="flex min-h-11 items-center hover:text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="flex min-h-11 items-center hover:text-foreground">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/dmca" className="flex min-h-11 items-center hover:text-foreground">
                DMCA
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-9 flex max-w-[90rem] flex-col items-start justify-between gap-3 border-t px-4 pt-7 text-xs text-muted-foreground sm:px-6 md:mt-12 md:flex-row md:items-center md:pt-8 lg:px-8">
        <p>© {currentYear} MovieFlix. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="/feed.xml" className="flex min-h-8 items-center hover:text-foreground">
            RSS
          </a>
          <a href="/sitemap.xml" className="flex min-h-8 items-center hover:text-foreground">
            Sitemap
          </a>
          <a href="/llms.txt" className="flex min-h-8 items-center hover:text-foreground">
            LLMs.txt
          </a>
          <AnalyticsPreferencesButton />
        </div>
      </div>
    </footer>
  );
}
