import { ImageResponse } from 'next/og';
import { CollectionService } from '@/lib/services/CollectionService';
import { MovieService } from '@/lib/services/MovieService';
import { buildFranchiseWatchGuide } from '@/lib/franchise-guides';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';

export const alt = 'Movie Franchise Watch Order & Marathon Guide on MovieFlix';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

function resolveAbsoluteImageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return absoluteUrl(trimmed);
  return '';
}

export default async function CollectionOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let heading = 'Franchise Watch Order';
  let subtitle = 'Complete chronological release order, official trailers, marathon runtime, and streaming guide.';
  let pills: string[] = ['Chronological Watch Guide'];
  let backdropSrc = '';
  let posterSrc = '';

  try {
    const collection = await CollectionService.getBySlug(slug);
    const { data: movies, total } = await MovieService.getPublicCatalogPage({
      page: 1,
      itemsPerPage: 24,
      collectionSlug: collection.slug,
      orderBy: [{ releaseDate: 'asc' }, { id: 'asc' }],
    });
    const guide = buildFranchiseWatchGuide({
      title: collection.title,
      description: collection.description,
      movies,
      totalMovies: total,
      page: 1,
    });

    heading =
      guide.heading.length > 48 ? `${guide.heading.slice(0, 45).trimEnd()}...` : guide.heading;
    subtitle =
      guide.metaDescription.length > 130
        ? `${guide.metaDescription.slice(0, 127).trimEnd()}...`
        : guide.metaDescription;
    pills = [
      `${total} ${total === 1 ? 'Movie' : 'Movies'}`,
      ...(guide.marathonLabel ? [`${guide.marathonLabel} Marathon`] : []),
      ...(guide.yearRange ? [guide.yearRange] : []),
    ];

    const rawBackdrop = collection.backdropUrl || collection.coverImageUrl || '';
    if (rawBackdrop) {
      backdropSrc = resolveAbsoluteImageUrl(getTmdbImageUrl(rawBackdrop, 1280));
    }
    const rawPoster = collection.posterUrl || movies[0]?.posterUrl || '';
    if (rawPoster) {
      posterSrc = resolveAbsoluteImageUrl(getTmdbImageUrl(rawPoster, 500));
    }
  } catch {
    // Fallback to branded card if DB is unreachable
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
          backgroundImage: backdropSrc
            ? `linear-gradient(90deg, rgba(13,14,12,0.97) 0%, rgba(13,14,12,0.88) 58%, rgba(13,14,12,0.55) 100%), url(${backdropSrc})`
            : 'linear-gradient(135deg, #0d0e0c 0%, #24211d 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: 21, color: '#e5e0d5' }}>
              {pills.map((pill) => (
                <span
                  key={pill}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontWeight: 600,
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            <div
              style={{
                fontSize: heading.length > 32 ? 54 : 64,
                lineHeight: 1.04,
                letterSpacing: '-2px',
                fontWeight: 700,
              }}
            >
              {heading}
            </div>

            <div style={{ fontSize: 24, lineHeight: 1.38, color: '#bdb9b0', maxWidth: '720px' }}>
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
              <span>Complete Franchise Watch Order &amp; Trailers</span>
            </div>
          </div>
        </div>

        {posterSrc ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={posterSrc}
              alt={heading}
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
