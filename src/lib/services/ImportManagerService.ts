import { ImportRepository } from '../repositories/ImportRepository';
import { MovieImportPipeline } from '../jobs/pipelines/MovieImportPipeline';
import { ImportJobStatus } from '@prisma/client';
import { ValidationError, NotFoundError } from '../errors';

export class ImportManagerService {
  /**
   * Enqueues a new movie import job.
   * If a pending or in-progress job exists for this TMDB ID, it returns that job.
   */
  static async enqueueMovieImport(tmdbId: number) {
    // Basic duplication check to avoid spamming the same job
    const existingJobs = await ImportRepository.list({
      status: ImportJobStatus.PENDING,
    });
    const duplicate = existingJobs.data.find((j) => j.tmdbId === tmdbId);
    if (duplicate) {
      return duplicate;
    }

    const inProgressJobs = await ImportRepository.list({
      status: ImportJobStatus.IN_PROGRESS,
    });
    const duplicateInProgress = inProgressJobs.data.find((j) => j.tmdbId === tmdbId);
    if (duplicateInProgress) {
      return duplicateInProgress;
    }

    // Create the persistent job record
    const job = await ImportRepository.create(tmdbId, 'Movie');

    // Fire and forget the pipeline worker (background execution)
    void new MovieImportPipeline(job.id).run({ tmdbId }).catch(console.error);

    return job;
  }

  static async listJobs(params: { skip?: number; take?: number; status?: ImportJobStatus }) {
    const skip = params.skip || 0;
    const take = params.take || 50;
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
    const job = await ImportRepository.findById(id);
    if (!job) {
      throw new NotFoundError(`Import job with id ${id} not found`);
    }
    return job;
  }

  static async cancelJob(id: string) {
    const job = await ImportRepository.findById(id);
    if (!job) {
      throw new NotFoundError(`Import job with id ${id} not found`);
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
