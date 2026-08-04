'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Public page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">Something went wrong</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        We encountered an unexpected error while loading this page. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} size="lg">
          <RefreshCcw className="mr-2 w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
