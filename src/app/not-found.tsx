import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-8xl font-black text-muted-foreground/20">404</h1>
      <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
      <p className="text-muted-foreground max-w-md pb-4">
        Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <Link href="/">
        <Button variant="default" size="lg">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
