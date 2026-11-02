import { registerOTel } from '@vercel/otel';
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Initialize OpenTelemetry
  registerOTel({ serviceName: 'movieflix' });

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only register cleanup handlers on the Node.js runtime (not Edge)
    const { prisma } = await import('@/lib/prisma');
    let isShuttingDown = false;
    // Attempt graceful shutdown
    const cleanup = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      const { logger } = await import('@/lib/logger');
      logger.info('Shutting down server, disconnecting Prisma...');
      await prisma.$disconnect();
      await Sentry.close(2000); // Wait up to 2s to flush events
      process.exit(0);
    };

    // Attach to termination signals
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    // Periodic background database maintenance in production (every 24 hours, first run after 10m)
    if (process.env.NODE_ENV === 'production') {
      const { DatabaseMaintenanceService } = await import('@/lib/services/DatabaseMaintenanceService');
      const MAINTENANCE_INTERVAL_MS = 24 * 60 * 60 * 1000;
      const INITIAL_DELAY_MS = 10 * 60 * 1000;

      setTimeout(() => {
        void DatabaseMaintenanceService.runPruning().catch(() => {});
        const timer = setInterval(() => {
          void DatabaseMaintenanceService.runPruning().catch(() => {});
        }, MAINTENANCE_INTERVAL_MS);
        timer.unref?.();
      }, INITIAL_DELAY_MS).unref?.();
    }
  }
}
