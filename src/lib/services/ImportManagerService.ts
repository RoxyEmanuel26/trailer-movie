import { ImportRepository } from '../repositories/ImportRepository';
import { ImportJobStatus } from '@prisma/client';
import { ValidationError, NotFoundError } from '../errors';
import { requireAdmin } from '../auth/utils';

export class ImportManagerService {
  /**
   * Enqueues a new movie import job.
   * If a pending or in-progress job exists for this TMDB ID, it returns that job.
   */
  static async enqueueMovieImport(tmdbId: number) {
    await requireAdmin('write:imports');
    // Targeted duplication check: find any active job (PENDING or IN_PROGRESS) for this TMDB ID.
    // This is a single O(1) indexed lookup - faster and reliable regardless of queue size.
    const activeJob = await ImportRepository.findActivJobByTmdbId(tmdbId);
    if (activeJob) {
      return activeJob;
    }

    // Create the persistent job record
    const job = await ImportRepository.create(tmdbId, 'Movie');

    // Fire and forget promise removed to avoid unbounded memory/database connections.
    // A background polling worker handles PENDING jobs via FOR UPDATE SKIP LOCKED.

    return job;
  }

  static async listJobs(params: { skip?: number; take?: number; status?: ImportJobStatus }) {
    await requireAdmin('read:imports');
    const skip = params.skip || 0;
    const take = Math.min(Number(params.take) || 50, 100);
    const { data, total } = await ImportRepository.list({ ...params, skip, take });
    return {
      data,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  static async getJob(id: string) {
    await requireAdmin('read:imports');
    const job = await ImportRepository.findById(id);
    if (!job) {
      throw new NotFoundError(`Import job with id ${id} not found`);
    }
    return job;
  }

  static async cancelJob(id: string) {
    await requireAdmin('write:imports');
    const job = await ImportRepository.findById(id);
    if (!job) {
      return { deleted: true, alreadyDeleted: true };
    }
    
    // We only allow deleting PENDING, FAILED or COMPLETED jobs. 
    // We cannot easily cancel an IN_PROGRESS node promise right now.
    if (job.status === ImportJobStatus.IN_PROGRESS) {
      throw new ValidationError("Cannot cancel a job that is currently in progress");
    }

    await ImportRepository.delete(id);
    return { deleted: true };
  }
}
