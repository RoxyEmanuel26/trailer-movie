"use client"

import * as React from "react"
import Image from "next/image"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

export interface WatchProvidersProps {
  providers?: any;
  links?: any[];
  movieSlug?: string;
  movieTitle?: string;
}

interface UnifiedProvider {
  id: string | number;
  name: string;
  normalizedName: string;
  logoUrl: string | null;
  directUrl: string;
  fallbackLink?: string | null;
  priorityScore: number;
  types: Set<'stream' | 'rent' | 'buy'>;
}

/**
 * Normalizes provider names to eliminate duplicate variants like
 * "Netflix Standard with Ads", "Prime Video with ads", etc.
 */
function normalizeProviderName(rawName: string): string {
  const norm = rawName.trim();
  if (/^netflix/i.test(norm)) return 'Netflix';
  if (/amazon|prime video/i.test(norm)) return 'Prime Video';
  if (/apple/i.test(norm)) return 'Apple TV';
  if (/disney/i.test(norm)) return 'Disney+';
  if (/google/i.test(norm)) return 'Google Play';
  if (/youtube/i.test(norm)) return 'YouTube';
  if (/hbo|max/i.test(norm) && !/maxdome/i.test(norm)) return 'Max';
  if (/sky/i.test(norm)) return 'Sky';
  if (/canal/i.test(norm)) return 'CANAL+';
  if (/^wow/i.test(norm)) return 'WOW';
  if (/paramount/i.test(norm)) return 'Paramount+';
  if (/peacock/i.test(norm)) return 'Peacock';
  if (/vidio/i.test(norm)) return 'Vidio';
  if (/catchplay/i.test(norm)) return 'Catchplay+';
  if (/viu/i.test(norm)) return 'Viu';
  if (/bioskop/i.test(norm)) return 'Bioskop Online';
  if (/plex/i.test(norm)) return 'Plex';
  if (/rakuten/i.test(norm)) return 'Rakuten TV';
  if (/vudu|fandango/i.test(norm)) return 'Vudu';
  if (/tubi/i.test(norm)) return 'Tubi';
  if (/pluto/i.test(norm)) return 'Pluto TV';
  if (/crunchyroll/i.test(norm)) return 'Crunchyroll';
  if (/crave/i.test(norm)) return 'Crave';
  if (/starz/i.test(norm)) return 'Starz';
  return norm;
}

/**
 * Builds direct watch/search deep links on the streaming platform
 * so clicking immediately opens that service ready to watch the movie.
 */
export function getDirectWatchUrl(providerName: string, movieTitle: string): string {
  const norm = providerName.toLowerCase();
  const titleEnc = encodeURIComponent(movieTitle.trim());

  // 1. Netflix
  if (norm.includes('netflix')) {
    return `https://www.netflix.com/search?q=${titleEnc}`;
  }
  // 2. Amazon Prime Video / Amazon Video
  if (norm.includes('prime') || norm.includes('amazon')) {
    return `https://www.amazon.com/s?k=${titleEnc}&i=instant-video`;
  }
  // 3. Disney Plus
  if (norm.includes('disney')) {
    return `https://www.disneyplus.com/search?q=${titleEnc}`;
  }
  // 4. Apple TV / iTunes Store
  if (norm.includes('apple')) {
    return `https://tv.apple.com/search?term=${titleEnc}`;
  }
  // 5. Google Play Movies & TV / Google TV
  if (norm.includes('google')) {
    return `https://play.google.com/store/search?q=${titleEnc}&c=movies`;
  }
  // 6. YouTube Movies & TV
  if (norm.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movieTitle} movie`)}`;
  }
  // 7. Max / HBO Max
  if (norm.includes('max') || norm.includes('hbo')) {
    return `https://play.max.com/search?q=${titleEnc}`;
  }
  // 8. Hulu
  if (norm.includes('hulu')) {
    return `https://www.hulu.com/search?q=${titleEnc}`;
  }
  // 9. Paramount+
  if (norm.includes('paramount')) {
    return `https://www.paramountplus.com/search/?q=${titleEnc}`;
  }
  // 10. Peacock
  if (norm.includes('peacock')) {
    return `https://www.peacocktv.com/search?q=${titleEnc}`;
  }
  // 11. Vidio (Indonesia)
  if (norm.includes('vidio')) {
    return `https://www.vidio.com/search?q=${titleEnc}`;
  }
  // 12. Catchplay+
  if (norm.includes('catchplay')) {
    return `https://www.catchplay.com/id/search?q=${titleEnc}`;
  }
  // 13. Viu
  if (norm.includes('viu')) {
    return `https://www.viu.com/ott/id/id/all/search?keyword=${titleEnc}`;
  }
  // 14. Bioskop Online
  if (norm.includes('bioskop')) {
    return `https://bioskoponline.com/search?q=${titleEnc}`;
  }
  // 15. Plex
  if (norm.includes('plex')) {
    return `https://app.plex.tv/desktop/#!/search?query=${titleEnc}`;
  }
  // 16. Vudu / Fandango at Home
  if (norm.includes('vudu') || norm.includes('fandango')) {
    return `https://www.vudu.com/content/movies/search?searchString=${titleEnc}`;
  }
  // 17. Tubi TV
  if (norm.includes('tubi')) {
    return `https://tubitv.com/search/${titleEnc}`;
  }
  // 18. Pluto TV
  if (norm.includes('pluto')) {
    return `https://pluto.tv/en/search/details/movies/${titleEnc}`;
  }
  // 19. Rakuten TV
  if (norm.includes('rakuten')) {
    return `https://rakuten.tv/search?q=${titleEnc}`;
  }
  // 20. Sky Store / Sky
  if (norm.includes('sky')) {
    return `https://www.skystore.com/search?term=${titleEnc}`;
  }
  // 21. Crunchyroll
  if (norm.includes('crunchyroll')) {
    return `https://www.crunchyroll.com/search?q=${titleEnc}`;
  }
  // 22. Crave
  if (norm.includes('crave')) {
    return `https://www.crave.ca/en/search?q=${titleEnc}`;
  }
  // 23. Starz
  if (norm.includes('starz')) {
    return `https://www.starz.com/us/en/search?query=${titleEnc}`;
  }
  // 24. CANAL+
  if (norm.includes('canal')) {
    return `https://www.canalplus.com/recherche/${titleEnc}`;
  }
  // 25. MUBI
  if (norm.includes('mubi')) {
    return `https://mubi.com/search?query=${titleEnc}`;
  }
  // 26. WOW (Sky Deutschland)
  if (norm.includes('wow')) {
    return `https://www.wowtv.de/search?q=${titleEnc}`;
  }
  // 27. Viaplay
  if (norm.includes('viaplay')) {
    return `https://viaplay.com/search?query=${titleEnc}`;
  }

  // Fallback: Smart Google Search that targets the watch page on that platform
  return `https://www.google.com/search?q=${encodeURIComponent(`watch "${movieTitle}" on ${providerName}`)}`;
}

const POPULAR_WEIGHTS: Record<string, number> = {
  'netflix': 100,
  'prime video': 95,
  'disney+': 90,
  'apple tv': 85,
  'max': 80,
  'youtube': 75,
  'google play': 70,
  'vidio': 68,
  'catchplay+': 67,
  'viu': 66,
  'hulu': 65,
  'paramount+': 64,
  'peacock': 63,
  'plex': 60,
  'tubi': 58,
  'pluto tv': 57,
  'sky': 55,
  'rakuten tv': 50,
  'canal+': 45,
};

function getProviderScore(normalizedName: string, displayPriority?: number): number {
  const lower = normalizedName.toLowerCase();
  for (const [key, weight] of Object.entries(POPULAR_WEIGHTS)) {
    if (lower === key || lower.includes(key)) return weight;
  }
  return 30 - Math.min(displayPriority ?? 20, 25);
}

export function WatchProviders({ 
  providers, 
  links,
  movieSlug,
  movieTitle,
}: WatchProvidersProps) {
  const [filter, setFilter] = React.useState<'all' | 'stream' | 'rent_buy'>('all');
  const [isExpanded, setIsExpanded] = React.useState(false);

  const effectiveTitle = movieTitle?.trim() || movieSlug?.replace(/-/g, ' ') || 'Movie';

  // 1. Unify, normalize, and deduplicate providers
  const providerMap = new Map<string, UnifiedProvider>();

  // A. Parse from database relations (`links`)
  if (links && Array.isArray(links) && links.length > 0) {
    for (const l of links) {
      if (!l.provider) continue;
      const rawName = l.provider.name;
      const normalized = normalizeProviderName(rawName);
      const accessCategory: 'stream' | 'rent' | 'buy' = 
        l.accessType === 'FLATRATE' || l.accessType === 'FREE' || l.accessType === 'ADS'
          ? 'stream'
          : l.accessType === 'RENT'
          ? 'rent'
          : 'buy';

      const existing = providerMap.get(normalized);
      if (existing) {
        existing.types.add(accessCategory);
        // Prefer higher resolution / existing logo
        if (!existing.logoUrl && l.provider.logoUrl) {
          existing.logoUrl = l.provider.logoUrl;
        }
      } else {
        providerMap.set(normalized, {
          id: l.provider.id || l.provider.tmdbId,
          name: normalized,
          normalizedName: normalized,
          logoUrl: l.provider.logoUrl,
          directUrl: getDirectWatchUrl(normalized, effectiveTitle),
          fallbackLink: l.linkUrl,
          priorityScore: getProviderScore(normalized, l.provider.displayPriority),
          types: new Set([accessCategory]),
        });
      }
    }
  }

  // B. Parse from JSON fallback if links is empty or supplemental
  if (providerMap.size === 0 && providers) {
    const listFlatrate = providers.flatrate || [];
    const listFree = providers.free || [];
    const listAds = providers.ads || [];
    const listRent = providers.rent || [];
    const listBuy = providers.buy || [];

    const processItems = (items: any[], cat: 'stream' | 'rent' | 'buy') => {
      for (const p of items) {
        const normalized = normalizeProviderName(p.provider_name);
        const existing = providerMap.get(normalized);
        if (existing) {
          existing.types.add(cat);
          if (!existing.logoUrl && p.logo_path) {
            existing.logoUrl = `https://image.tmdb.org/t/p/w92${p.logo_path}`;
          }
        } else {
          providerMap.set(normalized, {
            id: p.provider_id,
            name: normalized,
            normalizedName: normalized,
            logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
            directUrl: getDirectWatchUrl(normalized, effectiveTitle),
            fallbackLink: providers.link || null,
            priorityScore: getProviderScore(normalized, p.display_priority),
            types: new Set([cat]),
          });
        }
      }
    };

    processItems(listFlatrate, 'stream');
    processItems(listFree, 'stream');
    processItems(listAds, 'stream');
    processItems(listRent, 'rent');
    processItems(listBuy, 'buy');
  }

  // Sort providers by priority score (Netflix, Prime Video, Disney+, Apple TV first)
  const allProviders = Array.from(providerMap.values()).sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

  if (allProviders.length === 0) {
    return (
      <div className="mt-6 p-4 rounded-xl border bg-card/50">
        <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Available on</h3>
        <p className="text-xs text-muted-foreground/60 italic">No streaming provider data found for this movie.</p>
      </div>
    );
  }

  // Filter based on active tab
  const filteredProviders = allProviders.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'stream') return p.types.has('stream');
    if (filter === 'rent_buy') return p.types.has('rent') || p.types.has('buy');
    return true;
  });

  const streamCount = allProviders.filter((p) => p.types.has('stream')).length;
  const rentBuyCount = allProviders.filter((p) => p.types.has('rent') || p.types.has('buy')).length;

  // Collapse / Expand threshold
  const INITIAL_LIMIT = 12;
  const shouldTruncate = filteredProviders.length > INITIAL_LIMIT;
  const displayProviders = isExpanded || !shouldTruncate 
    ? filteredProviders 
    : filteredProviders.slice(0, INITIAL_LIMIT);

  const hiddenCount = filteredProviders.length - INITIAL_LIMIT;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${baseUrl}/watch/${movieSlug}`,
    "offers": allProviders.map((p) => ({
      "@type": "Offer",
      "name": p.name,
      "url": p.directUrl,
      "category": p.types.has('stream') ? 'subscription' : 'rental'
    }))
  } : null;

  return (
    <div className="mt-6 p-4 rounded-xl border bg-card shadow-sm">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">Available on</h3>
          <p className="text-[11px] text-muted-foreground">Watch directly on official platforms</p>
        </div>
        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {allProviders.length} {allProviders.length === 1 ? 'service' : 'services'}
        </span>
      </div>

      {/* Filter Tabs if both stream and rent/buy exist */}
      {streamCount > 0 && rentBuyCount > 0 && (
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg mb-3.5 text-xs font-medium border">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center text-[11px] ${
              filter === 'all' 
                ? 'bg-background shadow-xs text-foreground font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({allProviders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('stream')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center text-[11px] ${
              filter === 'stream' 
                ? 'bg-background shadow-xs text-foreground font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Stream ({streamCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('rent_buy')}
            className={`flex-1 py-1 px-2 rounded-md transition-all text-center text-[11px] ${
              filter === 'rent_buy' 
                ? 'bg-background shadow-xs text-foreground font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rent / Buy ({rentBuyCount})
          </button>
        </div>
      )}

      {/* Provider Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
        {displayProviders.map((provider) => {
          const isStream = provider.types.has('stream');
          const isRentBuy = provider.types.has('rent') || provider.types.has('buy');
          const badgeText = isStream && isRentBuy ? 'Stream/Rent' : isStream ? 'Stream' : 'Rent/Buy';

          return (
            <a
              key={provider.normalizedName}
              href={provider.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Watch "${effectiveTitle}" on ${provider.name} ↗`}
              className="group relative flex flex-col items-center gap-1 p-1.5 rounded-xl border bg-muted/20 hover:bg-muted/80 hover:border-primary/50 transition-all duration-200 hover:scale-[1.04] shadow-xs"
            >
              {/* Logo / Thumbnail */}
              <div className="relative w-11 h-11 rounded-lg overflow-hidden border bg-background shadow-xs flex items-center justify-center shrink-0">
                {provider.logoUrl ? (
                  <Image 
                    src={provider.logoUrl} 
                    alt={provider.name} 
                    fill 
                    sizes="44px"
                    className="object-cover transition-transform group-hover:scale-105 duration-200" 
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-center font-bold px-1 text-muted-foreground">
                    {provider.name.slice(0, 4)}
                  </div>
                )}
                {/* External link indicator badge on hover */}
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-full p-0.5 text-white shadow-xs">
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Provider Name */}
              <span className="text-[10px] font-semibold text-center truncate w-full leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                {provider.name}
              </span>

              {/* Type pill */}
              <span className="text-[8px] tracking-tight uppercase text-muted-foreground/80 font-medium scale-95 -mt-0.5 truncate">
                {badgeText}
              </span>
            </a>
          );
        })}
      </div>

      {/* Expand / Collapse Button */}
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-1.5 px-3 rounded-lg border bg-muted/40 hover:bg-muted text-xs font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>+{hiddenCount} more services</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}

      {/* Footer disclaimer */}
      <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Click to watch on platform ↗</span>
        <span className="opacity-70">JustWatch / TMDB</span>
      </div>
    </div>
  );
}

export function WatchProvidersSkeleton() {
  return (
    <div className="mt-6 p-4 rounded-xl border bg-card animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3"></div>
      <div className="grid grid-cols-4 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 bg-muted rounded-lg"></div>
            <div className="w-10 h-2 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}