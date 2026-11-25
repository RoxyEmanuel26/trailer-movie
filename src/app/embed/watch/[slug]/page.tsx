import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { Clock, ExternalLink, Film, Star } from 'lucide-react';
import { MovieService } from '@/lib/services/MovieService';
import { YouTubePlayer } from '@/components/public/YouTubePlayer';
import { extractYouTubeId } from '@/lib/utils/youtube';
import { extractUniqueProviders } from '@/lib/movie-aeo';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import { MovieFlixMark } from '@/components/brand/MovieFlixLogo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await MovieService.getPublicMovie(slug);
  if (!result) notFound();
  const { movie, canonicalPath } = result;
  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
  return {
    title: `${movie.title}${year ? ` (${year})` : ''} — Official Trailer Embed`,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    robots: { index: false, follow: false },
  };
}

export default async function EmbedMovieCardPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await MovieService.getPublicMovie(slug);
  if (!result) notFound();
  if (result.shouldRedirect) {
    permanentRedirect(`/embed${result.canonicalPath}`);
  }

  const { movie, canonicalPath } = result;
  const watchUrl = absoluteUrl(canonicalPath);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
  const primaryTrailer =
    movie.trailers.find((t) => t.status === 'ACTIVE' && t.sourceType === 'YOUTUBE' && t.isPrimary) ||
    movie.trailers.find((t) => t.status === 'ACTIVE' && t.sourceType === 'YOUTUBE');
  const youtubeId =
    extractYouTubeId(primaryTrailer?.sourceId || '') ||
    extractYouTubeId(movie.youtubeTrailerId || '');
  const { names: providerNames } = extractUniqueProviders(
    movie.watchProviderLinks as any,
    movie.watchProviders,
  );

  return (
    <article className="mx-auto flex max-w-[680px] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#141512] text-[#f8f4ec] shadow-2xl">
      <div className="grid gap-4 p-4 sm:grid-cols-[1.25fr_1fr] sm:items-center">
        {/* Left: Click-to-play YouTube trailer */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          {youtubeId ? (
            <YouTubePlayer
              videoId={youtubeId}
              movieId={movie.id}
              movieTitle={movie.title}
              backdropUrl={movie.backdropUrl || movie.posterUrl}
              className="rounded-xl"
            />
          ) : movie.backdropUrl || movie.posterUrl ? (
            <Image
              src={movie.backdropUrl || movie.posterUrl || ''}
              alt={movie.title}
              fill
              sizes="400px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/50">
              <Film className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Right: Movie Quick Facts & Attribution CTA */}
        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e25b38] hover:underline"
            >
              <MovieFlixMark className="h-4 w-4" />
              <span>{siteConfig.name}</span>
            </a>

            <h1 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-white">
              <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#f48a6f]">
                {movie.title}
              </a>{' '}
              {year ? <span className="font-normal text-white/60">({year})</span> : null}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
              {movie.voteAverage ? (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {movie.voteAverage.toFixed(1)}
                </span>
              ) : null}
              {movie.runtimeMinutes ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {movie.runtimeMinutes}m
                </span>
              ) : null}
              {movie.genres.slice(0, 2).map((g) => (
                <span key={g.genreId} className="rounded bg-white/8 px-1.5 py-0.5 text-[11px]">
                  {g.genre.name}
                </span>
              ))}
            </div>

            {movie.synopsis ? (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/70">
                {movie.synopsis}
              </p>
            ) : null}

            {providerNames.length > 0 ? (
              <p className="mt-2 truncate text-[11px] text-white/65">
                <strong className="font-semibold text-white/90">Stream on:</strong>{' '}
                {providerNames.slice(0, 3).join(', ')}
              </p>
            ) : null}
          </div>

          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#e25b38] px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <span>Full Cast &amp; Streaming Guide</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
