import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { ImportManagerService } from "@/lib/services/ImportManagerService";

export const GET = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("read:imports");
  const { id } = await params;
  
  const job = await ImportManagerService.getJob(id);
  
  return successResponse({ job });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("delete:imports");
  const { id } = await params;
  
  const result = await ImportManagerService.cancelJob(id);
  
  return successResponse(result);
});
