import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { SeoService } from '@/lib/services/SeoService';
import {
  THEME_CATALOG,
  THEME_CATEGORY_LABELS,
  type ThemeCategory,
} from '@/lib/theme-catalog';
import { MIN_INDEXABLE_GUIDE_MOVIES } from '@/lib/programmatic-guides';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, organizationSchemaId, websiteSchemaId } from '@/lib/site-config';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'themes', {
    title: 'Movies by Theme & Trope — Time Travel, True Stories, Heist, Cyberpunk & More',
    description:
      'Discover movies by theme, mood, and story trope—including Christmas classics, movies based on true stories, time travel, found footage horror, plot twists, heist, anime, and folk horror.',
    path: '/themes',
  });
}

export default async function ThemesHubPage() {
  const counts = await MovieService.countThemeGroups(THEME_CATALOG);
  const visibleThemes = THEME_CATALOG.map((theme) => ({
    theme,
    count: counts.get(theme.slug) || 0,
  })).filter((entry) => entry.count >= MIN_INDEXABLE_GUIDE_MOVIES);

  const categories: ThemeCategory[] = [
    'seasonal-favorites',
    'mind-bending',
    'horror-thriller',
    'true-stories',
    'action-world',
  ];

  const canonicalUrl = absoluteUrl('/themes');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: 'Movies by Theme & Trope',
        description:
          'Curated movie guides organized by popular story tropes, subgenres, and seasonal moods on MovieFlix.',
        isPartOf: { '@id': websiteSchemaId() },
        publisher: { '@id': organizationSchemaId() },
        mainEntity: { '@id': `${canonicalUrl}#themes` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Movie Themes', item: canonicalUrl },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#themes`,
        name: 'Curated Movie Themes on MovieFlix',
        numberOfItems: visibleThemes.length,
        itemListElement: visibleThemes.map(({ theme }, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: theme.title,
          url: absoluteUrl(`/theme/${theme.slug}`),
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
          Movie Themes
        </span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Curated Story Tropes &amp; Subgenres</span>
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Movies by Theme &amp; Mood
        </h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
          Go beyond broad genres. Jump straight to time travel paradoxes, heist thrillers, movies based on true stories, folk horror, anime features, cyberpunk noir, or cozy holiday favorites.
        </p>
      </header>

      <div className="space-y-12">
        {categories.map((catKey) => {
          const entries = visibleThemes.filter((e) => e.theme.category === catKey);
          if (entries.length === 0) return null;

          return (
            <section key={catKey} aria-labelledby={`theme-cat-${catKey}`}>
              <h2
                id={`theme-cat-${catKey}`}
                className="mb-5 border-b pb-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
              >
                {THEME_CATEGORY_LABELS[catKey]}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {entries.map(({ theme, count }) => (
                  <Link
                    key={theme.slug}
                    href={`/theme/${theme.slug}`}
                    prefetch={false}
                    className="group flex flex-col justify-between rounded-2xl border bg-card/60 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                          {theme.label}
                        </h3>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                        {theme.tagline}
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
