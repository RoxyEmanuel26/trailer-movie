import { NextResponse } from 'next/server';
import { importQueueWorker } from '@/lib/jobs/ImportQueueWorker';
import { logger } from '@/lib/logger';

// This endpoint is meant to be called by Cloudflare Cron Triggers or an external cron service
export const POST = async (request: Request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (process.env.NODE_ENV === 'production') {
      if (!expectedToken) {
        logger.error('[CRON_ERROR] CRON_SECRET is not set in production!');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
      if (authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // In development, we still check it if provided
      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Process a single batch of imports
    await importQueueWorker.processNextBatch();

    return NextResponse.json({ success: true, message: 'Batch processed successfully' });
  } catch (error) {
    logger.error({ err: error }, '[CRON_ERROR] Failed to process imports');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
