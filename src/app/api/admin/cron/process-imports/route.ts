import { NextResponse } from 'next/server';
import { importQueueWorker } from '@/lib/jobs/ImportQueueWorker';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth/utils';

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
      try {
        await requireAdmin('write:imports');
      } catch (authError) {
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Unauthorized. Invalid Cron Secret or missing Admin Session.' }, { status: 401 });
        }
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