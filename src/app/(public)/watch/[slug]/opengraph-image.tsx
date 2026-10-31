import { ImageResponse } from 'next/og';
import { MovieService } from '@/lib/services/MovieService';
import { siteConfig } from '@/lib/site-config';
import { getTmdbImageUrl } from '@/lib/tmdb-image-loader';

export const alt = 'Movie trailer, cast and where to watch on MovieFlix';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function MovieOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = 'Discover Movies & Official Trailers';
  let yearText = '';
  let ratingText = '';
  let runtimeText = '';
  let genresText = '';
  let taglineText = 'Explore cast, crew, ratings, and official streaming options on MovieFlix.';
  let backdropSrc = '';
  let posterSrc = '';

  try {
    const result = await MovieService.getPublicMovie(slug);
    if (result?.movie) {
      const { movie } = result;
      title = movie.title.length > 52 ? `${movie.title.slice(0, 49).trimEnd()}...` : movie.title;
      if (movie.releaseDate) {
        yearText = String(new Date(movie.releaseDate).getUTCFullYear());
      }
      if (movie.voteAverage && movie.voteAverage > 0) {
        ratingText = `★ ${movie.voteAverage.toFixed(1)}`;
      }
      if (movie.runtimeMinutes && movie.runtimeMinutes > 0) {
        runtimeText = `${movie.runtimeMinutes} min`;
      }
      if (movie.genres.length > 0) {
        genresText = movie.genres
          .slice(0, 3)
          .map((g) => g.genre.name)
          .join(' • ');
      }
      if (movie.tagline?.trim()) {
        taglineText =
          movie.tagline.length > 110
            ? `${movie.tagline.slice(0, 107).trimEnd()}...`
            : movie.tagline;
      } else if (movie.synopsis?.trim()) {
        taglineText =
          movie.synopsis.length > 120
            ? `${movie.synopsis.slice(0, 117).trimEnd()}...`
            : movie.synopsis;
      }
      if (movie.backdropUrl) {
        backdropSrc = getTmdbImageUrl(movie.backdropUrl, 1280);
      }
      if (movie.posterUrl) {
        posterSrc = getTmdbImageUrl(movie.posterUrl, 500);
      }
    }
  } catch {
    // Serve branded fallback card if database or upstream artwork is temporarily unreachable.
  }

  const metaPills = [yearText, ratingText, runtimeText, genresText].filter(Boolean);

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
            {metaPills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: 21, color: '#e5e0d5' }}>
                {metaPills.map((pill) => (
                  <span
                    key={pill}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      fontWeight: 600,
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}

            <div
              style={{
                fontSize: title.length > 32 ? 54 : 64,
                lineHeight: 1.04,
                letterSpacing: '-2px',
                fontWeight: 700,
              }}
            >
              {title}
            </div>

            <div style={{ fontSize: 24, lineHeight: 1.38, color: '#bdb9b0', maxWidth: '720px' }}>
              {taglineText}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#e25b38',
                color: '#fffaf5',
                padding: '14px 26px',
                borderRadius: '14px',
                fontSize: 23,
                fontWeight: 700,
              }}
            >
              <span>▶ Watch Official Trailer & Streaming Guide</span>
            </div>
          </div>
        </div>

        {posterSrc ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={posterSrc}
              alt={title}
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
    size
  );
}
