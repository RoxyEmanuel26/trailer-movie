import { NextResponse } from 'next/server';
import { importQueueWorker } from '@/lib/jobs/ImportQueueWorker';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/utils';

export const maxDuration = 300; // Allow up to 5 minutes execution time for heavy batches

// This endpoint is meant to be called by Cloudflare Cron Triggers, OR manually by an Admin via the UI
export const POST = async (request: Request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    let isAuthorizedByCron = false;

    if (expectedToken && authHeader === `Bearer ${expectedToken}`) {
      isAuthorizedByCron = true;
    }

    // If not authorized by CRON_SECRET, fallback to checking if it's a logged-in Admin
    if (!isAuthorizedByCron) {
      await requireAdmin('write:imports');
    }

    // Process a single batch of imports
    const processedCount = await importQueueWorker.processNextBatch();

    return NextResponse.json({ success: true, processed: processedCount, message: 'Batch processed successfully' });
  } catch (error) {
    logger.error({ err: error }, '[CRON_ERROR] Failed to process imports');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};