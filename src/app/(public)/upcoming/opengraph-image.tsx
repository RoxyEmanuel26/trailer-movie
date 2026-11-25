import { ImageResponse } from 'next/og';
import { MovieService } from '@/lib/services/MovieService';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';

export const alt = 'Upcoming Movies & Official Trailers — Global Release Calendar on MovieFlix';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 1800;

function resolveAbsoluteImageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return absoluteUrl(trimmed);
  return '';
}

export default async function UpcomingOpenGraphImage() {
  let countLabel = 'Verified Theatrical Release Calendar';
  let subtitle =
    'Watch verified official YouTube trailers and track release countdowns across the US, Europe, and Asia.';
  let posterSrc = '';

  try {
    const { data, total } = await MovieService.getPublicCatalogPage({
      page: 1,
      itemsPerPage: 4,
      upcomingOnly: true,
      orderBy: [{ popularity: 'desc' }, { releaseDate: 'asc' }, { id: 'asc' }],
    });
    if (total > 0) {
      countLabel = `${total.toLocaleString('en-US')} Upcoming Releases With Trailers`;
    }
    const topTitles = data.map((m) => m.title).join(', ');
    if (topTitles) {
      subtitle = `Featuring ${topTitles} — official trailers, release dates, countdowns & cast lists.`;
    }
    if (data[0]?.posterUrl) {
      posterSrc = resolveAbsoluteImageUrl(getTmdbImageUrl(data[0].posterUrl, 342));
    }
  } catch {
    // Fallback to branded card
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: '54px 64px',
          backgroundColor: '#0d0e0c',
          backgroundImage:
            'radial-gradient(circle at 82% 20%, rgba(226,91,56,0.34) 0%, rgba(13,14,12,0) 50%), linear-gradient(135deg, #0d0e0c 0%, #1d1b18 100%)',
          color: '#f8f4ec',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            paddingRight: posterSrc ? '44px' : '0px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 30, fontWeight: 700 }}>
            <svg width="46" height="46" viewBox="0 0 40 40">
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
            <span>{siteConfig.name}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex' }}>
              <span
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(226,91,56,0.18)',
                  border: '1px solid rgba(226,91,56,0.55)',
                  color: '#f9a38b',
                  fontSize: 21,
                  fontWeight: 700,
                }}
              >
                {countLabel}
              </span>
            </div>

            <div
              style={{
                fontSize: 64,
                lineHeight: 1.03,
                letterSpacing: '-2.5px',
                fontWeight: 700,
              }}
            >
              Upcoming Movies &amp; Official Trailers
            </div>

            <div style={{ fontSize: 25, lineHeight: 1.38, color: '#c4c0b6', maxWidth: '720px' }}>
              {subtitle}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#e25b38',
                color: '#fffaf5',
                padding: '14px 26px',
                borderRadius: '14px',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#fffaf5" d="M8 5v14l11-7z" />
              </svg>
              <span>US · Europe · Asia Release Schedule</span>
            </div>
          </div>
        </div>

        {posterSrc ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={posterSrc}
              alt="Most anticipated upcoming movie"
              width={320}
              height={480}
              style={{
                width: '320px',
                height: '480px',
                objectFit: 'cover',
                borderRadius: '22px',
                border: '2px solid rgba(255,255,255,0.18)',
                boxShadow: '0 24px 50px rgba(0,0,0,0.65)',
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
