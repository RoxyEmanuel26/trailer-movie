import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import { TonightMatcher } from '@/components/public/TonightMatcher';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, organizationSchemaId, siteConfig, websiteSchemaId } from '@/lib/site-config';
import { buildFaqJsonLd, type MovieFaqItem } from '@/lib/movie-aeo';
import { normalizeRoomCode } from '@/lib/tonight-types';

interface PageProps {
  searchParams: Promise<{ room?: string | string[] }>;
}

export const dynamic = 'force-dynamic';

const TONIGHT_FAQS: MovieFaqItem[] = [
  {
    question: 'How does the MovieFlix What to Watch Tonight picker work?',
    answer:
      'Pick your mood, region (US, European, or Asian cinema), streaming service, and max runtime—then swipe through 15 curated movies with instant trailer previews. Every pick you like goes into your shortlist or personal Watchlist with zero signup required.',
  },
  {
    question: 'How do couples or friends match on a movie from separate phones?',
    answer:
      'Click "Match with a Partner / Friend" to generate a private 6-character room and share the invite link over WhatsApp, Telegram, X, or text. You both swipe independently on the same 15 trailers, and the page celebrates instantly the moment you both swipe right on the same movie.',
  },
  {
    question: 'Can I filter movie night picks by Netflix, Prime Video, Disney+, Sky, or European and Asian films?',
    answer:
      'Yes. Filter by major US, European, and Asian platforms including Netflix, Prime Video, Disney+, Apple TV, Max, Hulu, Sky, Rakuten TV, CANAL+, MUBI, Crunchyroll, Viu, and Vidio—as well as Hollywood, European, Korean, Japanese, and global cinema.',
  },
  {
    question: 'Do I need an account to save movies or create a room?',
    answer:
      'No account or email is required. Match rooms stay active for 24 hours via a simple room link, and your personal Watchlist is saved right in your browser with one-click shareable URLs.',
  },
];

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = await searchParams;
  const rawRoom = Array.isArray(query.room) ? query.room[0] : query.room;
  const roomCode = rawRoom ? normalizeRoomCode(rawRoom) : null;

  return SeoService.generateMetadata('Page', 'tonight', {
    title: roomCode
      ? `Join Movie Night Room ${roomCode} — Swipe & Match Trailers | ${siteConfig.name}`
      : 'What to Watch Tonight? Free Movie Picker & Couple Swipe Matcher',
    description:
      'Decide what movie to watch tonight in 30 seconds. Filter by mood, Netflix, Prime Video, Disney+, US, European & Asian cinema—or swipe live with your partner or friends to match.',
    image: '/tonight/opengraph-image',
    path: '/tonight',
    indexable: !roomCode,
  });
}

export default async function TonightPickerPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const rawRoom = Array.isArray(query.room) ? query.room[0] : query.room;
  const initialRoomCode = rawRoom ? normalizeRoomCode(rawRoom) : null;

  const initialDeck = await MovieService.getTonightDeck({ limit: 15 });
  const canonicalUrl = absoluteUrl('/tonight');
  const faqNode = buildFaqJsonLd(canonicalUrl, TONIGHT_FAQS);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#app`,
        name: 'MovieFlix Tonight — Movie Night Picker & Couple Matcher',
        url: canonicalUrl,
        applicationCategory: 'EntertainmentApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Interactive movie night picker and multiplayer couple/friend trailer swipe matcher covering US, European, and Asian films.',
        publisher: { '@id': organizationSchemaId() },
        isPartOf: { '@id': websiteSchemaId() },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Movie Night Picker', item: canonicalUrl },
        ],
      },
      ...(faqNode ? [faqNode] : []),
    ],
  };

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={jsonLd} />

      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">
          Movie Night Picker
        </span>
      </nav>

      <header className="mb-8 max-w-3xl sm:mb-10">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Interactive Movie Picker · Zero Signup</span>
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          What to Watch Tonight?
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          End 30 minutes of scrolling. Filter by mood, streaming service, runtime, and US, European, or Asian cinema—or invite your partner or friend to swipe trailers until you match.
        </p>
      </header>

      <TonightMatcher
        initialDeck={initialDeck}
        initialRoomCode={initialRoomCode}
        siteUrl={siteConfig.url}
      />

      {/* FAQ Section */}
      <section aria-labelledby="tonight-faq-heading" className="mt-14 max-w-4xl">
        <h2 id="tonight-faq-heading" className="mb-4 text-xl font-semibold tracking-[-0.025em]">
          Frequently asked questions
        </h2>
        <div className="divide-y overflow-hidden rounded-2xl border bg-card/50">
          {TONIGHT_FAQS.map((faq, index) => (
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
    </div>
  );
}
