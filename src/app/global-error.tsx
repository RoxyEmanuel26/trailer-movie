'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error }, 'Global error caught in root layout');
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2>A fatal error occurred!</h2>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
