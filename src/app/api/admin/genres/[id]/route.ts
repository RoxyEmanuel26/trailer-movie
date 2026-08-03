import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";

export const PATCH = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("update:genres");
  const id = params.id as string;
  return successResponse({ updatedId: id });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("delete:genres");
  const id = params.id as string;
  return successResponse({ deletedId: id });
});
