import Link from 'next/link';
import Image from 'next/image';
import { Clock, Play, Star } from 'lucide-react';

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
    releaseDate: Date | null;
    runtimeMinutes?: number | null;
    mpaaRating?: string | null;
    rating?: number | null;
    voteAverage?: number | null;
  };
  className?: string;
  priority?: boolean;
}

export function MovieCard({ movie, className = '', priority = false }: MovieCardProps) {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const displayRating = movie.voteAverage
    ? movie.voteAverage.toFixed(1)
    : movie.rating
      ? (movie.rating / 10).toFixed(1)
      : null;

  return (
    <Link
      href={`/watch/${movie.slug}`}
      className={`group relative flex min-w-0 flex-col gap-2.5 sm:gap-3 ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[0.9rem] bg-muted shadow-[0_1rem_2.5rem_-1.4rem_rgba(0,0,0,.75)] ring-1 ring-black/5 transition duration-300 group-active:scale-[0.99] sm:rounded-[1.1rem] [@media(hover:hover)]:group-hover:-translate-y-1 [@media(hover:hover)]:group-hover:shadow-[0_1.5rem_3rem_-1.2rem_rgba(0,0,0,.8)] dark:ring-white/10">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition duration-500 [@media(hover:hover)]:group-hover:scale-[1.045] [@media(hover:hover)]:group-hover:brightness-[.72]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-center text-sm font-medium text-muted-foreground">
            Artwork unavailable
          </div>
        )}

        {/* Hover Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform duration-300 group-hover:scale-100">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </div>
        </div>

        {/* Rating Badge */}
        {displayRating ? (
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg bg-black/72 px-2 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {displayRating}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.02em] transition-colors sm:text-base sm:leading-tight [@media(hover:hover)]:group-hover:text-primary">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          {year && <span className="tabular-nums">{year}</span>}
          {year && movie.runtimeMinutes ? <span aria-hidden="true">·</span> : null}
          {movie.runtimeMinutes ? (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{movie.runtimeMinutes}m</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}
