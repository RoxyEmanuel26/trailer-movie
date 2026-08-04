import Link from 'next/link';
import Image from 'next/image';
import { Layers } from 'lucide-react';

interface CollectionCardProps {
  collection: {
    title: string;
    slug: string;
    coverImageUrl: string | null;
    _count?: {
      movies: number;
    };
  };
  className?: string;
}

export function CollectionCard({ collection, className = '' }: CollectionCardProps) {
  return (
    <Link href={`/collection/${collection.slug}`} className={`group relative flex flex-col gap-3 overflow-hidden ${className}`}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted transition-transform group-hover:scale-[1.02]">
        {collection.coverImageUrl ? (
          <Image
            src={collection.coverImageUrl}
            alt={collection.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-all duration-300 group-hover:brightness-75"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <Layers className="h-8 w-8 opacity-50" />
            <span className="text-sm font-medium">No Cover</span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Content on top of image */}
        <div className="absolute bottom-0 left-0 flex w-full flex-col p-4">
          <h3 className="line-clamp-1 text-lg font-bold text-white shadow-black drop-shadow-md">
            {collection.title}
          </h3>
          {collection._count?.movies !== undefined && (
            <p className="text-xs font-medium text-white/80 drop-shadow-md">
              {collection._count.movies} {collection._count.movies === 1 ? 'Movie' : 'Movies'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
  );
}
