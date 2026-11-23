import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const alt = 'MovieFlix Tonight — What to Watch Tonight Movie Picker & Couple Matcher';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TonightOpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '68px 72px',
        backgroundColor: '#0d0e0c',
        backgroundImage:
          'radial-gradient(circle at 86% 18%, rgba(226,91,56,0.34) 0%, rgba(13,14,12,0) 48%), linear-gradient(135deg, #0d0e0c 0%, #191815 100%)',
        color: '#f8f4ec',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: 32, fontWeight: 700 }}>
          <svg width="54" height="54" viewBox="0 0 40 40">
            <path
              fill="#e25b38"
              d="M9.25 2.75h6.1c1.47 0 2.9.43 4.11 1.24l15.02 10.08a7.14 7.14 0 0 1 0 11.86L19.46 36.01a7.38 7.38 0 0 1-4.11 1.24h-6.1A6.5 6.5 0 0 1 2.75 30.75V9.25a6.5 6.5 0 0 1 6.5-6.5Z"
            />
            <path
              fill="#fffaf5"
              d="m17.04 11.78 11.3 7.15a1.27 1.27 0 0 1 0 2.14l-11.3 7.15A1.32 1.32 0 0 1 15 27.1V12.9a1.32 1.32 0 0 1 2.04-1.12Z"
            />
            <rect x="7" y="8" width="4" height="5" rx="1.25" fill="#fffaf5" />
            <rect x="7" y="17.5" width="4" height="5" rx="1.25" fill="#fffaf5" />
            <rect x="7" y="27" width="4" height="5" rx="1.25" fill="#fffaf5" />
          </svg>
          {siteConfig.name}
        </div>
        <div
          style={{
            display: 'flex',
            padding: '10px 22px',
            borderRadius: '999px',
            border: '1px solid rgba(226,91,56,0.55)',
            backgroundColor: 'rgba(226,91,56,0.16)',
            color: '#f9a38b',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          FREE · ZERO SIGNUP
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: 1000 }}>
        <div style={{ fontSize: 74, lineHeight: 1.02, letterSpacing: '-3px', fontWeight: 700 }}>
          Can&apos;t decide what to watch tonight?
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.4, color: '#c4c0b6' }}>
          Swipe official trailers solo or match live with your partner &amp; friends across Netflix, Prime Video, Disney+, Sky, US, European &amp; Asian cinema.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: 22, color: '#e5e0d5' }}>
        <span style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
          30-Second Solo Picker
        </span>
        <span style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
          Couple &amp; Friend Room Match
        </span>
        <span style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
          Instant Trailer Previews
        </span>
      </div>
    </div>,
    size,
  );
}
