import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";

export const PATCH = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("update:tags");
  return successResponse({ updatedId: params.id });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("delete:tags");
  return successResponse({ deletedId: params.id });
});
