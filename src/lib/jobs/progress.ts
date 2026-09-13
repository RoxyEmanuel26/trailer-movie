import { ImportRepository } from '../repositories/ImportRepository';

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

  async update(stage: string, progress: number, logMessage?: string) {
    this.state.stage = stage;
    this.state.progress = Math.min(Math.max(progress, 0), 100);
    if (logMessage) {
      this.state.logs.push(`[${new Date().toISOString()}] [${stage}] ${logMessage}`);
    }
    await ImportRepository.updateProgress(this.state.jobId, stage, this.state.progress, this.state as any);
  }

  error(message: string) {
    this.state.retryCount++;
    this.state.logs.push(`[${new Date().toISOString()}] [ERROR] ${message}`);
  }

  finish(completed = true) {
    this.state.finishedAt = new Date();
    this.state.durationMs = this.state.finishedAt.getTime() - this.state.startedAt.getTime();
    if (completed) this.state.progress = 100;
  }

  getState(): Readonly<ProgressState> {
    return this.state;
  }
}
