import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    : (movie.rating ? (movie.rating / 10).toFixed(1) : null);

  return (
    <Link href={`/watch/${movie.slug}`} className={`group relative flex flex-col gap-2 overflow-hidden ${className}`}>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted transition-transform group-hover:scale-105">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition-all duration-300 group-hover:brightness-75"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm font-medium">
            Coming Soon
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
            Watch Trailer
          </div>
        </div>

        {/* Rating Badge */}
        {displayRating ? (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {displayRating}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-1 font-semibold leading-tight tracking-tight group-hover:text-primary">
          {movie.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {year && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{year}</span>
            </div>
          )}
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
