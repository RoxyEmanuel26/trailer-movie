import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const alt = 'MovieFlix — discover movies, trailers, cast and where to watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: '#0d0e0c',
        color: '#f8f4ec',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 34, fontWeight: 700 }}>
        <div style={{ display: 'flex', width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', background: '#e65335' }}>M</div>
        {siteConfig.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 980 }}>
        <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: '-3px', fontWeight: 700 }}>
          Discover movies, trailers and where to watch.
        </div>
        <div style={{ fontSize: 29, lineHeight: 1.4, color: '#b9b6ad' }}>
          Explore stories, cast, crew, ratings and viewing information from one curated catalog.
        </div>
      </div>
    </div>,
    size
  );
}
