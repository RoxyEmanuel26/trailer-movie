import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { importQueueWorker } from '@/lib/jobs/ImportQueueWorker';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/utils';
import { isLocalImportMode } from '@/lib/jobs/execution-mode';
import { AppError } from '@/lib/errors';

export const maxDuration = 300; // Allow up to 5 minutes execution time for heavy batches

function matchesBearerSecret(authHeader: string | null, expectedToken: string | undefined): boolean {
  if (!authHeader || !expectedToken || !expectedToken.trim()) return false;
  const expectedHeader = `Bearer ${expectedToken}`;
  const actualBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expectedHeader);
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}

export const POST = async (request: Request) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    const isAuthorizedByCron = matchesBearerSecret(
      request.headers.get('authorization'),
      process.env.CRON_SECRET,
    );

    // If not authorized by CRON_SECRET, fallback to checking if it's a logged-in Admin
    if (!isAuthorizedByCron) {
      await requireAdmin('write:imports');
    }

    if (isLocalImportMode()) {
      return NextResponse.json(
        { error: 'Import processing runs on the local worker; this endpoint only accepts jobs in remote mode' },
        { status: 409 },
      );
    }

    // Process a single batch of imports
    const summary = await importQueueWorker.processNextBatch();

    return NextResponse.json({ success: true, processed: summary.claimed, ...summary, message: 'Batch processed successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error({ err: error }, '[CRON_ERROR] Failed to process imports');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
