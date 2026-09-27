import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';
import { HomepageService } from '@/lib/services/HomepageService';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';

export const alt = 'MovieFlix — discover movies, trailers, cast and where to watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

export default async function OpenGraphImage() {
  let heroTitle = 'Discover movies, trailers and where to watch.';
  let heroImage = '';
  try {
    const homepage = await HomepageService.getSmartHomepageData();
    heroTitle = homepage.hero ? `Discover ${homepage.hero.title} and what to watch next.` : heroTitle;
    heroImage = homepage.heroBackdrop ? getTmdbImageUrl(homepage.heroBackdrop, 1280) : '';
  } catch {
    // The branded fallback remains valid while the catalog database is unavailable.
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        backgroundColor: '#0d0e0c',
        backgroundImage: heroImage
          ? `linear-gradient(90deg, rgba(13,14,12,.98) 0%, rgba(13,14,12,.78) 52%, rgba(13,14,12,.35) 100%), url(${heroImage})`
          : 'linear-gradient(135deg, #0d0e0c 0%, #24211d 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#f8f4ec',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 34, fontWeight: 700 }}>
        <svg width="58" height="58" viewBox="0 0 40 40">
          <path fill="#e25b38" d="M9.25 2.75h6.1c1.47 0 2.9.43 4.11 1.24l15.02 10.08a7.14 7.14 0 0 1 0 11.86L19.46 36.01a7.38 7.38 0 0 1-4.11 1.24h-6.1A6.5 6.5 0 0 1 2.75 30.75V9.25a6.5 6.5 0 0 1 6.5-6.5Z" />
          <path fill="#fffaf5" d="m17.04 11.78 11.3 7.15a1.27 1.27 0 0 1 0 2.14l-11.3 7.15A1.32 1.32 0 0 1 15 27.1V12.9a1.32 1.32 0 0 1 2.04-1.12Z" />
          <rect x="7" y="8" width="4" height="5" rx="1.25" fill="#fffaf5" />
          <rect x="7" y="17.5" width="4" height="5" rx="1.25" fill="#fffaf5" />
          <rect x="7" y="27" width="4" height="5" rx="1.25" fill="#fffaf5" />
        </svg>
        {siteConfig.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 980 }}>
        <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: '-3px', fontWeight: 700 }}>
          {heroTitle}
        </div>
        <div style={{ fontSize: 29, lineHeight: 1.4, color: '#b9b6ad' }}>
          Explore stories, cast, crew, ratings and viewing information from one curated catalog.
        </div>
      </div>
    </div>,
    size
  );
}
