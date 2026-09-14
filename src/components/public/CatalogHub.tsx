import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl } from '@/lib/site-config';

interface CatalogHubItem {
  href: string;
  title: string;
  description: string;
  count?: number;
}

export function CatalogHub({
  eyebrow,
  title,
  description,
  path,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  items: CatalogHubItem[];
}) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${absoluteUrl(path)}#page`, url: absoluteUrl(path), name: title, description },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: title, item: absoluteUrl(path) },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.title, url: absoluteUrl(item.href),
        })),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <JsonLd data={graph} />
      <nav aria-label="Breadcrumb" className="mb-7 flex gap-2 text-xs font-medium text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link><span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">{title}</span>
      </nav>
      <header className="mb-9 max-w-3xl sm:mb-12">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
      </header>
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group min-h-40 bg-card p-5 transition-colors hover:bg-accent sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-[-0.03em] group-hover:text-primary">{item.title}</h2>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
            {typeof item.count === 'number' ? <p className="mt-4 text-xs font-semibold tabular-nums">{item.count.toLocaleString()} {item.count === 1 ? 'movie' : 'movies'}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
