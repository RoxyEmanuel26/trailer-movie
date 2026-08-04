'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error({ err: error }, 'App router error boundary caught an error');
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md">
        We've encountered an unexpected error. Our team has been notified.
      </p>
      <div className="flex items-center gap-4 pt-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Return Home
        </Button>
      </div>
    </div>
  );
}
