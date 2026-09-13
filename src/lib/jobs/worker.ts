import { ProgressTracker } from './progress';
import { PartialJobError } from './retry';
import { ImportRepository } from '../repositories/ImportRepository';
import { classifyJobError, calculateRetryAt } from './error-classification';

export abstract class BaseWorker<T = any> {
  protected jobId: string;
  protected tracker: ProgressTracker;
  protected maxRetries: number;

  constructor(jobId: string, maxRetries = 4) {
    this.jobId = jobId;
    this.maxRetries = maxRetries;
    this.tracker = new ProgressTracker(jobId);
  }

  /**
   * Abstract method that concrete workers must implement.
   */
  protected abstract execute(data: T): Promise<unknown>;

  /**
   * The entry point invoked by the Queue consumer.
   */
  async run(data: T): Promise<void> {
    try {
      const result = await this.execute(data);
      this.tracker.finish();
      await ImportRepository.complete(this.jobId, result as any);
    } catch (error: unknown) {
      const job = await ImportRepository.findById(this.jobId);
      const attempt = job?.attemptCount || 1;
      const classified = classifyJobError(error);
      const partial = error instanceof PartialJobError;
      const retryable = classified.retryable && attempt < this.maxRetries;
      this.tracker.error(`Attempt ${attempt} failed: ${classified.message}`);
      this.tracker.finish(false);
      await ImportRepository.fail(this.jobId, {
        code: classified.code,
        message: classified.message,
        retryable,
        partial,
        nextAttemptAt: retryable ? calculateRetryAt(attempt, classified.retryAfterSeconds) : undefined,
        logs: this.tracker.getState() as any,
      });
    }
  }
}
