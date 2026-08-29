import * as React from "react"
import Image from "next/image"

export function WatchProviders({ providers, movieSlug }: { providers: any, movieSlug?: string }) {
  if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) {
    return (
      <div className="mt-6 p-4 rounded-xl border bg-card/50">
        <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Watch Providers</h3>
        <p className="text-xs text-muted-foreground/60 italic">No streaming data available for this region.</p>
      </div>
    );
  }

  const allProviders = [
    ...(providers.flatrate || []),
    ...(providers.rent || []),
    ...(providers.buy || []),
  ].filter((v, i, a) => a.findIndex(t => (t.provider_id === v.provider_id)) === i);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${baseUrl}/watch/${movieSlug}`,
    "offers": allProviders.map((p: any) => ({
      "@type": "Offer",
      "name": p.provider_name,
      "category": "subscription"
    }))
  } : null;

  return (
    <div className="mt-6 p-4 rounded-xl border bg-card">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <h3 className="text-sm font-semibold mb-3">Available on</h3>
      <div className="flex flex-wrap gap-3">
        {allProviders.map((provider: any) => (
          <div key={provider.provider_id} className="relative w-10 h-10 rounded-lg overflow-hidden border shadow-sm" title={provider.provider_name}>
            <Image 
              src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} 
              alt={provider.provider_name}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Data provided by JustWatch</p>
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