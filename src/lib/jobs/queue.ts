export interface JobPayload {
  jobId: string;
  name: string;
  data: any;
}

export interface IQueue {
  enqueue(name: string, data: any): Promise<string>;
  cancel(jobId: string): Promise<boolean>;
  getJob(jobId: string): Promise<JobPayload | null>;
}

/**
 * Placeholder queue implementation.
 * Designed to be swapped with BullMQ, Redis, or Cloud Tasks in the future.
 */
export class MemoryQueue implements IQueue {
  private jobs: Map<string, JobPayload> = new Map();

  async enqueue(name: string, data: any): Promise<string> {
    const jobId = crypto.randomUUID();
    this.jobs.set(jobId, { jobId, name, data });
    return jobId;
  }

  async cancel(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async getJob(jobId: string): Promise<JobPayload | null> {
    return this.jobs.get(jobId) || null;
  }
}

export const queue = new MemoryQueue();
