import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { ImportRepository } from "@/lib/repositories/ImportRepository";
import { ImportJobStatus } from "@prisma/client";
import { ValidationError, NotFoundError } from "@/lib/errors";

export const POST = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("create:imports");
  const { id } = await params;

  const job = await ImportRepository.findById(id);
  if (!job) {
    throw new NotFoundError(`Import job with id ${id} not found`);
  }

  if (job.status !== ImportJobStatus.FAILED) {
    throw new ValidationError(`Only FAILED jobs can be retried. Current status: ${job.status}`);
  }

  // Reset status back to PENDING so the worker picks it up on the next cycle.
  // We intentionally do NOT pass `logs` here so the existing failure logs are preserved
  // (updateStatus with no logs param keeps the existing DB value via undefined → skip update).
  await ImportRepository.updateStatus(id, ImportJobStatus.PENDING);

  return successResponse({ retried: true, jobId: id });
});
