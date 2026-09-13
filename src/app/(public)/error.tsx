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
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[70vh]">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
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
