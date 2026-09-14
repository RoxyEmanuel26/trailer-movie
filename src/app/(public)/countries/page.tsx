import type { Metadata } from 'next';
import { CatalogHub } from '@/components/public/CatalogHub';
import { MovieService } from '@/lib/services/MovieService';
import { ORIGIN_CATALOG } from '@/lib/public-catalog';
import { SeoService } from '@/lib/services/SeoService';

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'countries', { title: 'Movies by Country and Language', description: 'Explore published movies by production country or spoken language, including films connected to more than one origin group in MovieFlix.', path: '/countries' });
}
export default async function CountriesPage() {
  const items = await Promise.all(ORIGIN_CATALOG.map(async (item) => {
    const { total } = await MovieService.searchMovies({ countryCodes: item.countryCodes, languageCodes: item.languageCodes, take: 1 });
    return { href: `/origin/${item.slug}`, title: item.label, description: `Discover films connected to ${item.label} through production origin or a matching spoken language.`, count: total };
  }));
  return <CatalogHub eyebrow="Explore global cinema" title="Movies by country and language" description="Browse MovieFlix by production origin and spoken language. A film can appear in both relevant groups when its production country and language differ." path="/countries" items={items} />;
}
