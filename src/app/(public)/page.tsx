import { Metadata } from 'next';
import { HomepageService } from '@/lib/services/HomepageService';
import { SeoService } from '@/lib/services/SeoService';
import { SectionRenderer } from '@/components/public/SectionRenderer';
import { MovieCard } from '@/components/public/MovieCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return SeoService.generateMetadata('Page', 'home');
}

export default async function HomePage() {
  const [sections, featuredItems] = await Promise.all([
    HomepageService.listSections(),
    HomepageService.listFeaturedItems(),
  ]);

  const activeSections = sections.filter(s => s.isActive);
  const activeFeatured = featuredItems.filter(f => f.isActive);
  const hasHero = activeFeatured.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      {hasHero && (
        <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden bg-black flex flex-col justify-end">
          {activeFeatured[0].movie?.backdropUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
              style={{ backgroundImage: `url(${activeFeatured[0].movie.backdropUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="container relative mx-auto px-4 pb-16 z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
              {activeFeatured[0].customHeadline || activeFeatured[0].movie?.title}
            </h1>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href={`/watch/${activeFeatured[0].movie?.slug as string}`}>
                  Watch Trailer
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      <div className="flex flex-col gap-8 py-8">
        {activeSections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 py-16 text-center border-t mt-8">
        <h2 className="text-3xl font-bold mb-4">Looking for something specific?</h2>
        <p className="text-muted-foreground mb-8">Search through our extensive library of movie trailers.</p>
        <Button size="lg" asChild>
          <Link href="/search">Advanced Search</Link>
        </Button>
      </section>
    </div>
  );
}
