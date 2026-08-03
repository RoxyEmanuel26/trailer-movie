export interface ProgressState {
  jobId: string;
  stage: string;
  progress: number;
  logs: string[];
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  retryCount: number;
}

export class ProgressTracker {
  private state: ProgressState;

  constructor(jobId: string) {
    this.state = {
      jobId,
      stage: 'INIT',
      progress: 0,
      logs: [],
      startedAt: new Date(),
      retryCount: 0,
    };
  }

  update(stage: string, progress: number, logMessage?: string) {
    this.state.stage = stage;
    this.state.progress = Math.min(Math.max(progress, 0), 100);
    if (logMessage) {
      this.state.logs.push(`[${new Date().toISOString()}] [${stage}] ${logMessage}`);
    }
    // In a real implementation, this might flush to Redis or ImportRepository every N updates
  }

  error(message: string) {
    this.state.logs.push(`[${new Date().toISOString()}] [ERROR] ${message}`);
  }

  finish() {
    this.state.finishedAt = new Date();
    this.state.durationMs = this.state.finishedAt.getTime() - this.state.startedAt.getTime();
    this.state.progress = 100;
  }

  getState(): Readonly<ProgressState> {
    return this.state;
  }
}
