import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ArrowUpRight } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import {
  STUDIO_CATALOG,
  STUDIO_REGION_LABELS,
  type StudioRegion,
} from '@/lib/studio-catalog';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'studios', {
    title: 'Movies by Film Studio — A24, Blumhouse, TOHO, StudioCanal, Pixar & More',
    description:
      'Browse movies from iconic US, European, and Asian film studios including A24, Blumhouse, Marvel Studios, Pixar, BBC Film, StudioCanal, TOHO, CJ ENM, and Toei Animation.',
    path: '/studios',
  });
}

export default async function StudiosHubPage() {
  const counts = await MovieService.countStudioGroups(STUDIO_CATALOG);
  const visibleStudios = STUDIO_CATALOG.map((studio) => ({
    studio,
    count: counts.get(studio.slug) || 0,
  })).filter((entry) => entry.count >= 3);

  const regions: StudioRegion[] = ['us', 'europe', 'asia'];
  const canonicalUrl = absoluteUrl('/studios');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: 'Movies by Film Studio',
        description:
          'Curated index of iconic American, European, and Asian film production studios on MovieFlix.',
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': `${canonicalUrl}#studios` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Film Studios', item: canonicalUrl },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#studios`,
        name: 'Global Film Studios on MovieFlix',
        numberOfItems: visibleStudios.length,
        itemListElement: visibleStudios.map(({ studio }, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${studio.name} Movies`,
          url: absoluteUrl(`/studio/${studio.slug}`),
        })),
      },
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
          Film Studios
        </span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Global Production Houses · US, Europe &amp; Asia</span>
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Movies by Film Studio
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          Explore catalogs from the world&apos;s most influential studios—from A24, Blumhouse, Pixar, and Warner Bros. to BBC Film, StudioCanal, Pathé, TOHO, CJ ENM, and Toei Animation.
        </p>
      </header>

      <div className="space-y-12">
        {regions.map((regionKey) => {
          const regionMeta = STUDIO_REGION_LABELS[regionKey];
          const entries = visibleStudios.filter((e) => e.studio.region === regionKey);
          if (entries.length === 0) return null;

          return (
            <section key={regionKey} aria-labelledby={`studio-region-${regionKey}`}>
              <div className="mb-5 border-b pb-4">
                <h2
                  id={`studio-region-${regionKey}`}
                  className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
                >
                  {regionMeta.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{regionMeta.subtitle}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {entries.map(({ studio, count }) => (
                  <Link
                    key={studio.slug}
                    href={`/studio/${studio.slug}`}
                    prefetch={false}
                    className="group flex flex-col justify-between rounded-2xl border bg-card/60 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                            {studio.name}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                            {studio.countryLabel}
                          </p>
                        </div>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {studio.tagline}
                      </p>
                    </div>
                    <p className="mt-4 text-xs font-semibold tabular-nums text-foreground">
                      {count.toLocaleString('en-US')} {count === 1 ? 'movie' : 'movies'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
