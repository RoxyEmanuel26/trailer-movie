import { ProgressTracker } from './progress';
import { NonRetryableJobError, calculateExponentialBackoff } from './retry';
import { ImportRepository } from '../repositories/ImportRepository';
import { ImportJobStatus } from '@prisma/client';

export abstract class BaseWorker<T = any> {
  protected jobId: string;
  protected tracker: ProgressTracker;
  protected maxRetries: number;

  constructor(jobId: string, maxRetries = 3) {
    this.jobId = jobId;
    this.maxRetries = maxRetries;
    this.tracker = new ProgressTracker(jobId);
  }

  /**
   * Abstract method that concrete workers must implement.
   */
  protected abstract execute(data: T): Promise<void>;

  /**
   * The entry point invoked by the Queue consumer.
   */
  async run(data: T): Promise<void> {
    let currentAttempt = 0;

    // Status is already set to IN_PROGRESS atomically by fetchJobsForProcessing.
    // No need to call updateStatus here again.

    while (currentAttempt <= this.maxRetries) {
      try {
        await this.execute(data);

        this.tracker.finish();
        // Remove successfully completed jobs immediately to prevent UI clutter
        await ImportRepository.delete(this.jobId);
        return; // Success
      } catch (error: any) {
        currentAttempt++;
        this.tracker.error(`Attempt ${currentAttempt} failed: ${error.message}`);

        if (error instanceof NonRetryableJobError || currentAttempt > this.maxRetries) {
          this.tracker.finish();
          await ImportRepository.updateStatus(
            this.jobId,
            ImportJobStatus.FAILED,
            this.tracker.getState()
          );
          return; // Dead letter
        }

        // Wait before retrying
        const delay = calculateExponentialBackoff(currentAttempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
