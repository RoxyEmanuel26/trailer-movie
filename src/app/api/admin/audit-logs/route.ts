import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { AuditService } from "@/lib/services/AuditService";
import { ValidationError } from "@/lib/errors";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:audit");
  
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    throw new ValidationError("entityType and entityId are required parameters");
  }

  const logs = await AuditService.listLogs(entityType, entityId);
  return successResponse(logs);
});
