import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

const pages = {
  privacy: {
    eyebrow: 'Your data',
    title: 'Privacy policy',
    intro:
      'TrailerTube keeps its public browsing experience intentionally lightweight. This page explains what the site records and why.',
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
        'Trailer playback and external watch links can take you to services such as YouTube or a streaming provider. Their own privacy terms apply once you leave TrailerTube.',
      ],
      [
        'Your choices',
        'You can browse the public catalog without an account. For questions about stored account information, contact the site administrator.',
      ],
    ],
  },
  terms: {
    eyebrow: 'Using TrailerTube',
    title: 'Terms of service',
    intro:
      'By using TrailerTube, you agree to use the catalog and discovery features lawfully and responsibly.',
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
        'TrailerTube links to third-party video and streaming services. Purchases, subscriptions, and playback on those services are governed by their terms.',
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
      'TrailerTube is a discovery catalog. It does not host feature films and embeds or links to externally hosted trailers and provider pages.',
    sections: [
      [
        'Submitting a notice',
        'A rights holder can send a notice identifying the protected work, the exact TrailerTube URL, contact information, and a good-faith statement that the use is not authorized.',
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
  return page ? { title: page.title, description: page.intro } : { title: 'Page not found' };
}

export default async function InfoPage({ params }: { params: Promise<{ info: string }> }) {
  const { info } = await params;
  const page = pages[info as InfoPage];
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-9 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
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
      <p className="mt-8 text-sm text-muted-foreground">Last updated September 13, 2026.</p>
    </article>
  );
}
