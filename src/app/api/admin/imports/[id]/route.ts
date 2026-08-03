import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { queue } from "@/lib/jobs/queue";
import { NotFoundError } from "@/lib/errors";

export const GET = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("read:imports");
  const id = params.id as string;
  
  const job = await queue.getJob(id);
  if (!job) throw new NotFoundError("Job not found");

  return successResponse({ job });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("delete:imports");
  const id = params.id as string;
  
  await queue.cancel(id);
  return successResponse({ cancelled: true });
});
