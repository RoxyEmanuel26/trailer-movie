import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { MovieService } from '@/lib/services/MovieService';
import { STREAMING_CATALOG } from '@/lib/streaming-catalog';
import { SeoService } from '@/lib/services/SeoService';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'streaming', {
    title: 'Movies by Streaming Service — Netflix, Prime Video, Disney+ & More',
    description:
      'Browse published movies across Netflix, Prime Video, Disney+, Apple TV, Max, Hulu, Vidio, Viu, Tubi, MUBI, and official digital stores with trailers, cast, and regional viewing options.',
    path: '/streaming',
  });
}

export default async function StreamingHubPage() {
  const counts = await MovieService.countStreamingGroups(STREAMING_CATALOG);
  const items = STREAMING_CATALOG.map((item) => ({
    href: `/streaming/${item.slug}`,
    title: item.label,
    description: item.tagline,
    count: counts.get(item.slug) || 0,
  }));

  return (
    <CatalogHub
      eyebrow="Where to watch"
      title="Movies by streaming service"
      description="Explore MovieFlix titles available across major subscription streaming platforms, free ad-supported services, and digital storefronts. Regional lineups vary by territory—open any film to compare availability in your country."
      path="/streaming"
      items={items}
    />
  );
}
