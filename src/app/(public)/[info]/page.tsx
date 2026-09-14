import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SeoService } from '@/lib/services/SeoService';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, isValidContactEmail, siteConfig } from '@/lib/site-config';

const pages = {
  about: {
    eyebrow: 'About MovieFlix',
    title: 'A clearer way to discover movies',
    intro:
      'MovieFlix is an independent movie discovery catalog for exploring trailers, cast and crew, ratings, and viewing options in one place.',
    sections: [
      ['What we do', 'MovieFlix organizes movie information into accessible discovery pages that help viewers understand a title before choosing what to watch. Each eligible film page brings together its official trailer, synopsis, release year, runtime, genres, production origins, spoken languages, cast, crew, ratings, and locally stored viewing-provider information. The catalog is designed for exploration rather than playback, so the emphasis remains on clear facts, useful connections, and direct paths to related movies and people.'],
      ['How the catalog works', 'Movie records enter MovieFlix through authenticated administrative imports and persistent background jobs. Those jobs request data from TMDB, validate the result, save relationships in the local database, and record whether a movie meets the publication quality gate. Public pages read only that local database. Browsing a movie, actor, genre, country, or year page therefore does not create a new TMDB API request, which keeps the public experience predictable and reduces unnecessary dependency on an external API.'],
      ['What gets published', 'A newly imported movie is eligible for publication only when it is released and has a title, release date, synopsis, poster, genre, and active YouTube trailer. Records that do not meet those requirements remain drafts for administrative review. Person pages use a separate search-index quality rule based on a usable headshot and meaningful biography or filmography. These rules do not claim that every record is complete; they prevent obviously incomplete pages from being promoted as finished discovery destinations.'],
      ['How discovery is organized', 'Visitors can browse the catalog by genre, release year, production country, spoken language, popularity, rating, and date added. Country and language pages deliberately use an inclusive rule: a Japanese production spoken in English can appear in both the Japan group and the English group. Popularity and audience ratings are kept distinct, and the top-rated list requires a meaningful vote threshold before a title can qualify. Related links connect movies with their directors, actors, genres, origins, years, and recommendations.'],
      ['Our independence', 'MovieFlix is an independent discovery catalog. It is not a streaming platform, does not host feature films, and does not sell access to third-party services. Trailer embeds are served by YouTube after the visitor chooses to play them, while provider links lead to destinations operated under their own terms. TMDB supplies source metadata and artwork through the administrative import process, but TMDB does not endorse or certify MovieFlix.'],
      ['Accuracy and corrections', 'Release information, credits, ratings, trailers, and streaming availability can change over time. MovieFlix displays the latest data successfully stored by its background synchronization process and shows freshness information on movie pages. When a record appears incorrect, visitors can send the exact MovieFlix URL, identify the field in question, and provide a reliable supporting source. Corrections are reviewed rather than copied automatically into the public catalog.'],
      ['Privacy and performance', 'The public website is designed to work without an account. MovieFlix may record limited operational events such as page views, searches, trailer plays, errors, and sampled Core Web Vitals so the catalog can be improved. Search text is normalized and obvious email addresses or phone numbers are redacted before analytics storage. Heavy video players are not loaded before interaction, and responsive image sizes are used to reduce bandwidth and layout movement.'],
    ],
  },
  methodology: {
    eyebrow: 'How MovieFlix works',
    title: 'Catalog and rating methodology',
    intro:
      'We use transparent quality rules to decide which movie and person pages are ready for public discovery and search indexing.',
    sections: [
      ['Data sources', 'Movie metadata, credits, artwork, keywords, countries, languages, companies, collections, reviews, recommendations, and provider information originate from TMDB responses requested by authenticated administrative or background processes. Trailer records point to YouTube videos. MovieFlix stores the accepted response locally and serves public pages from that database. A public visit never triggers a TMDB refresh, and a missing TMDB subresponse does not silently erase previously valid local relationships.'],
      ['Import and synchronization', 'Each movie import is handled as a persistent job with recorded stages, progress, attempts, heartbeat, completion state, and errors. Core movie data is collected with an enriched TMDB request, while detailed person enrichment runs separately so the same actor or crew profile does not require repeated requests for every movie. Retryable network or service failures are deferred with controlled retries; permanent validation, authentication, and not-found failures remain visible for administrative review.'],
      ['Publishing quality', 'A new movie must have TMDB production status Released, a non-empty title, release date, synopsis, poster, at least one genre, and an effective active YouTube trailer before automatic publication. An effective trailer can come from the movie trailer identifier or an active YouTube Trailer record. Movies that fail the full rule remain drafts with explicit quality issues. Existing published movies are re-evaluated when essential poster or trailer media disappears.'],
      ['Person and catalog indexing', 'Publication and search indexing are separate decisions. A person profile can remain accessible to users but receives noindex when it lacks a headshot or enough substantive information. To enter the person sitemap, a profile needs a headshot, at least one relationship to a published movie, and either a biography of at least 160 characters or three published movie credits. Genre, origin, year, and similar catalog pages need at least three published movies and suitable introductory information before indexing.'],
      ['Top-rated ranking', 'The Top Rated list requires at least 50 recorded audience votes. Eligible movies are ordered with a Bayesian weighted rating that combines each movie’s vote average, vote count, the minimum-vote parameter, and the mean rating across the eligible catalog. This dampens small-sample extremes without replacing the displayed audience rating. Popularity, latest releases, and recently added lists use their own explicit ordering rules and should not be interpreted as editorial endorsements.'],
      ['Dates, availability, and trailers', 'Latest Releases excludes dates later than the current day, while year pages use an inclusive start-of-year and exclusive start-of-next-year range. Provider availability is informational and may vary by country, account, subscription, or time. MovieFlix does not create price Offer schema when a specific destination, currency, price, and availability cannot be verified. YouTube trailer schema uses the stored video identifier, thumbnail, and publication date when available.'],
      ['Corrections and freshness', 'Movie pages show when their local record was last updated. Background jobs refresh eligible records according to administrative scheduling and stale-data rules; a newer timestamp means the local record changed, not that every external source changed at that moment. Correction requests should include the exact MovieFlix URL, the disputed field, the proposed value, and a reliable primary or authoritative source. Requests are reviewed before protected or manually edited fields are changed.'],
    ],
  },
  contact: {
    eyebrow: 'Contact MovieFlix',
    title: 'Corrections, rights, and general questions',
    intro:
      'Contact the MovieFlix administrator with the exact page URL and enough detail for us to investigate your request.',
    sections: [
      ['Catalog corrections', 'Include the movie or person URL, the field that appears incorrect, and a reliable source showing the correct information.'],
      ['Rights notices', 'For copyright or rights-related requests, use the requirements described on our DMCA page so the notice can be reviewed efficiently.'],
      ['Privacy questions', 'For questions about analytics or account information, describe the request without sending passwords, authentication tokens, or other sensitive credentials.'],
    ],
  },
  privacy: {
    eyebrow: 'Your data',
    title: 'Privacy policy',
    intro:
      'MovieFlix keeps its public browsing experience intentionally lightweight. This page explains what the site records and why.',
    sections: [
      [
        'Information we collect',
        'We may record anonymous page views, searches, trailer plays, device details, and basic technical diagnostics. Account information is stored only when you create or administer an account.',
      ],
      [
        'How we use it',
        'Usage data helps us improve discovery, diagnose errors, protect the service, and understand which catalog features are useful. We do not sell personal information.',
      ],
      [
        'Third-party services',
        'Trailer playback and external watch links can take you to services such as YouTube or a streaming provider. Their own privacy terms apply once you leave MovieFlix.',
      ],
      [
        'Your choices',
        'You can browse the public catalog without an account. For questions about stored account information, contact the site administrator.',
      ],
    ],
  },
  terms: {
    eyebrow: 'Using MovieFlix',
    title: 'Terms of service',
    intro:
      'By using MovieFlix, you agree to use the catalog and discovery features lawfully and responsibly.',
    sections: [
      [
        'Catalog information',
        'Movie metadata, availability, ratings, and release information can change. We aim for accuracy but cannot guarantee that every listing is current in every region.',
      ],
      [
        'Acceptable use',
        'Do not attempt to disrupt the service, bypass access controls, scrape at harmful rates, or use the site in a way that infringes another party’s rights.',
      ],
      [
        'External destinations',
        'MovieFlix links to third-party video and streaming services. Purchases, subscriptions, and playback on those services are governed by their terms.',
      ],
      [
        'Changes',
        'We may update these terms as the service evolves. Continued use after an update means you accept the revised terms.',
      ],
    ],
  },
  dmca: {
    eyebrow: 'Rights & attribution',
    title: 'DMCA and content notices',
    intro:
      'MovieFlix is a discovery catalog. It does not host feature films and embeds or links to externally hosted trailers and provider pages.',
    sections: [
      [
        'Submitting a notice',
        'A rights holder can send a notice identifying the protected work, the exact MovieFlix URL, contact information, and a good-faith statement that the use is not authorized.',
      ],
      [
        'What happens next',
        'We review complete notices, restrict disputed material when appropriate, and may contact the affected source or account owner for clarification.',
      ],
      [
        'Metadata attribution',
        'Movie metadata and artwork are sourced from TMDB. Trailer playback and streaming destinations remain under their respective owners.',
      ],
    ],
  },
} as const;

type InfoPage = keyof typeof pages;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ info: string }>;
}): Promise<Metadata> {
  const { info } = await params;
  const page = pages[info as InfoPage];
  const requiresContact = info === 'contact' || info === 'dmca';
  return page
    ? SeoService.generateMetadata('Page', info, {
        title: page.title,
        description: page.intro,
        path: `/${info}`,
        indexable: !requiresContact || isValidContactEmail(siteConfig.contactEmail),
      })
    : { title: 'Page not found', robots: { index: false, follow: false } };
}

export default async function InfoPage({ params }: { params: Promise<{ info: string }> }) {
  const { info } = await params;
  const page = pages[info as InfoPage];
  if (!page) notFound();
  const pageUrl = absoluteUrl(`/${info}`);
  const schemaType = info === 'about' ? 'AboutPage' : info === 'contact' ? 'ContactPage' : 'WebPage';
  const showContact = (info === 'contact' || info === 'dmca') && isValidContactEmail(siteConfig.contactEmail);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': schemaType,
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.intro,
        isPartOf: { '@id': `${siteConfig.url}#website` },
        about: { '@id': `${siteConfig.url}#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        ...(siteConfig.contactEmail ? { email: siteConfig.contactEmail } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: page.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <JsonLd data={jsonLd} />
      <Link
        href="/"
        className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <header className="mb-10 max-w-3xl sm:mb-14">
        <p className="eyebrow mb-4">{page.eyebrow}</p>
        <h1 className="break-words text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
          {page.title}
        </h1>
        <p className="mt-5 max-w-[62ch] text-pretty text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
          {page.intro}
        </p>
      </header>
      <div className="divide-y border-y">
        {page.sections.map(([title, body]) => (
          <section
            key={title}
            className="grid gap-3 py-6 sm:grid-cols-[12rem_1fr] sm:gap-6 sm:py-8 lg:grid-cols-[14rem_1fr]"
          >
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="max-w-[65ch] break-words leading-7 text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
      {showContact ? (
        <p className="mt-8 rounded-xl border bg-card p-5 text-sm leading-6">
          Contact MovieFlix at{' '}
          <a className="font-semibold text-primary hover:underline" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>
          . Please include the exact MovieFlix URL in correction or rights-related requests.
        </p>
      ) : null}
      {(info === 'contact' || info === 'dmca') && !showContact ? (
        <p className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6">
          The public contact channel is being configured before launch. This page will remain excluded from search indexing until it is available.
        </p>
      ) : null}
      <p className="mt-8 text-sm text-muted-foreground">Last updated September 15, 2026.</p>
    </article>
  );
}
