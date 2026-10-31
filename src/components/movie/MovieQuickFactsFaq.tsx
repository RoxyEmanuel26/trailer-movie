import Link from 'next/link';
import { ChevronDown, Sparkles, Tv } from 'lucide-react';
import type { MatchedStreamingPlatformLink, MovieFaqItem } from '@/lib/movie-aeo';

interface MovieQuickFactsFaqProps {
  movieTitle: string;
  quickSummary: string;
  faqs: MovieFaqItem[];
  streamingHubLinks: MatchedStreamingPlatformLink[];
}

export function MovieQuickFactsFaq({
  movieTitle,
  quickSummary,
  faqs,
  streamingHubLinks,
}: MovieQuickFactsFaqProps) {
  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="quick-facts-heading"
        className="rounded-2xl border bg-card/70 p-5 shadow-xs sm:p-6"
      >
        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <h2 id="quick-facts-heading">Quick facts</h2>
        </div>
        <p className="max-w-[70ch] text-sm leading-6 text-foreground/90 sm:text-base sm:leading-7">
          {quickSummary}
        </p>

        {streamingHubLinks.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
              <Tv className="h-3.5 w-3.5" aria-hidden="true" />
              Explore platform catalogs:
            </span>
            {streamingHubLinks.slice(0, 6).map((hub) => (
              <Link
                key={hub.slug}
                href={`/streaming/${hub.slug}`}
                prefetch={false}
                className="rounded-full border bg-background px-3 py-1 font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {hub.name} movies
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {faqs.length > 0 ? (
        <section aria-labelledby="movie-faq-heading" className="flex flex-col gap-3">
          <h2 id="movie-faq-heading" className="text-xl font-semibold tracking-[-0.025em]">
            Frequently asked questions about {movieTitle}
          </h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card/50">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group/faq px-5 py-4 transition-colors open:bg-card/90"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground sm:text-base [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/faq:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2.5 max-w-[68ch] text-sm leading-6 text-muted-foreground sm:leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
