import Link from 'next/link';
import { Film, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-muted p-6 rounded-full mb-6">
        <Film className="w-16 h-16 text-muted-foreground opacity-50" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">Page Not Found</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        We couldn't find the page you were looking for. It might have been moved or deleted.
      </p>
      <Button asChild size="lg">
        <Link href="/">
          <Home className="mr-2 w-4 h-4" />
          Back to Homepage
        </Link>
      </Button>
    </div>
  );
}
