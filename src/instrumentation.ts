import { registerOTel } from '@vercel/otel';
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Initialize OpenTelemetry
  registerOTel({ serviceName: 'trailer-movie' });

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only register cleanup handlers on the Node.js runtime (not Edge)
    const { prisma } = await import('@/lib/prisma');
    const { importQueueWorker } = await import('@/lib/jobs/ImportQueueWorker');
    
    let isShuttingDown = false;
    // Attempt graceful shutdown
    const cleanup = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      const { logger } = await import('@/lib/logger');
      logger.info('Shutting down server, disconnecting Prisma...');
      importQueueWorker.stop();
      await prisma.$disconnect();
      await Sentry.close(2000); // Wait up to 2s to flush events
      process.exit(0);
    };

    // Attach to termination signals
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    // Start background workers (wrapped in Sentry to capture worker failures)
    Sentry.withScope((scope) => {
      scope.setTag('worker', 'importQueueWorker');
      try {
        importQueueWorker.start();
      } catch (err) {
        Sentry.captureException(err);
      }
    });
  }
}
