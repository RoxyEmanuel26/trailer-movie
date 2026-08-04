import Link from 'next/link';

interface GenreCardProps {
  genre: {
    name: string;
    slug: string;
  };
  className?: string;
}

export function GenreCard({ genre, className = '' }: GenreCardProps) {
  return (
    <Link href={`/genre/${genre.slug}`} className={`group block ${className}`}>
      <div className="flex h-24 items-center justify-center rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md">
        <h3 className="text-center font-bold tracking-tight text-foreground group-hover:text-primary">
          {genre.name}
        </h3>
      </div>
    </Link>
  );
}

export function GenreCardSkeleton() {
  return (
    <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
  );
}
