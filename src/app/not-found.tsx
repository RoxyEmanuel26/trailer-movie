import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MovieFlixMark } from '@/components/brand/MovieFlixLogo';

export default function NotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MovieFlixMark className="h-7 w-7 text-primary" />
        MovieFlix
      </div>
      <h1 className="text-8xl font-black text-muted-foreground/20">404</h1>
      <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="text-muted-foreground max-w-md pb-4">
        MovieFlix couldn&apos;t find the page you&apos;re looking for. It may have been removed or renamed.
      </p>
      <Link href="/">
        <Button variant="default" size="lg">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
