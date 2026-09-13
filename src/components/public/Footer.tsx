import Link from 'next/link';
import { Film } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-muted/30 py-10 sm:mt-16 sm:py-12">
      <div className="mx-auto grid max-w-[90rem] grid-cols-2 gap-x-6 gap-y-9 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 lg:px-8">
        <div className="col-span-2 flex max-w-md flex-col gap-4 md:col-span-1">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="font-bold text-lg">TrailerTube</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            A focused movie discovery guide powered by a locally indexed catalog—trailers, cast,
            reviews, and where to watch in one place.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm">Discover</h3>
          <ul className="flex flex-col text-sm text-muted-foreground">
            <li>
              <Link
                href="/search?status=PUBLISHED"
                className="flex min-h-11 items-center hover:text-foreground"
              >
                All Movies
              </Link>
            </li>
            <li>
              <Link
                href="/genre/action"
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Action movies
              </Link>
            </li>
            <li>
              <Link
                href="/genre/science-fiction"
                className="flex min-h-11 items-center hover:text-foreground"
              >
                Science fiction
              </Link>
            </li>
            <li>
              <Link href="/search" className="flex min-h-11 items-center hover:text-foreground">
                Advanced Search
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4 text-sm">Legal</h3>
          <ul className="flex flex-col text-sm text-muted-foreground">
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
        <p>© {new Date().getFullYear()} TrailerTube. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="/feed.xml" className="flex min-h-8 items-center hover:text-foreground">
            RSS
          </a>
          <Link href="/sitemap.xml" className="flex min-h-8 items-center hover:text-foreground">
            Sitemap
          </Link>
          <p className="basis-full sm:basis-auto">Metadata provided by TMDB.</p>
        </div>
      </div>
    </footer>
  );
}
