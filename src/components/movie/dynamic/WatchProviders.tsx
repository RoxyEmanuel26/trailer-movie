import * as React from "react"
import Image from "next/image"

export function WatchProviders({ 
  providers, 
  links,
  movieSlug 
}: { 
  providers?: any; 
  links?: any[]; 
  movieSlug?: string; 
}) {
  // 1. Build unified provider list
  let allProviders: { id: string | number; name: string; logoUrl: string | null; link?: string | null }[] = [];

  if (links && Array.isArray(links) && links.length > 0) {
    const seen = new Set<string>();
    for (const l of links) {
      if (l.provider && !seen.has(l.provider.name)) {
        seen.add(l.provider.name);
        allProviders.push({
          id: l.provider.id || l.provider.tmdbId,
          name: l.provider.name,
          logoUrl: l.provider.logoUrl,
          link: l.linkUrl,
        });
      }
    }
  }

  // Fallback to JSON if no links or as supplement
  if (allProviders.length === 0 && providers) {
    const jsonList = [
      ...(providers.flatrate || []),
      ...(providers.rent || []),
      ...(providers.buy || []),
    ].filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.provider_id === v.provider_id) === i);

    allProviders = jsonList.map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
      link: providers.link || null,
    }));
  }

  if (allProviders.length === 0) {
    return (
      <div className="mt-6 p-4 rounded-xl border bg-card/50">
        <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Watch Providers</h3>
        <p className="text-xs text-muted-foreground/60 italic">No streaming data available for this region.</p>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${baseUrl}/watch/${movieSlug}`,
    "offers": allProviders.map((p) => ({
      "@type": "Offer",
      "name": p.name,
      "category": "subscription"
    }))
  } : null;

  return (
    <div className="mt-6 p-4 rounded-xl border bg-card">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <h3 className="text-sm font-semibold mb-3">Available on</h3>
      <div className="flex flex-wrap gap-3">
        {allProviders.map((provider) => {
          const content = (
            <div 
              key={provider.id} 
              className="relative w-10 h-10 rounded-lg overflow-hidden border shadow-sm transition-transform hover:scale-105" 
              title={provider.name}
            >
              {provider.logoUrl ? (
                <Image 
                  src={provider.logoUrl} 
                  alt={provider.name} 
                  fill 
                  sizes="40px"
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-center font-bold px-1">
                  {provider.name.slice(0, 4)}
                </div>
              )}
            </div>
          );

          return provider.link ? (
            <a key={provider.id} href={provider.link} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <React.Fragment key={provider.id}>
              {content}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Data provided by JustWatch / TMDB</p>
    </div>
  )
}

export function WatchProvidersSkeleton() {
  return (
    <div className="mt-6 p-4 rounded-xl border bg-card animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3"></div>
      <div className="flex gap-3">
        {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 bg-muted rounded-lg"></div>)}
      </div>
    </div>
  )
}