import Link from 'next/link';
import { Film, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicNotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[70vh]">
      <div className="mb-6 rounded-full bg-muted p-6">
        <Film className="h-16 w-16 text-muted-foreground opacity-50" />
      </div>
      <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mb-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
        We couldn't find the page you were looking for. It might have been moved or deleted.
      </p>
      <Button asChild size="lg">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Back to Homepage
        </Link>
      </Button>
    </div>
  );
}
