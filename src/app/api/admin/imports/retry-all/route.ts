import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { ImportRepository } from "@/lib/repositories/ImportRepository";

export const POST = apiHandler(async (_request: NextRequest) => {
  await requireAdmin("create:imports");

  const result = await ImportRepository.retryAllFailed();

  return successResponse({ 
    retried: true, 
    count: result.count, 
    message: `Reset ${result.count} failed jobs back to pending.` 
  });
});
