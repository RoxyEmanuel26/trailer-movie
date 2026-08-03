import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { SettingUpdateSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async () => {
  await requireAdmin("read:settings");
  // Stub for SettingService
  return successResponse({ settings: [] });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  await requireAdmin("update:settings");
  const body = await request.json();
  const data = SettingUpdateSchema.parse(body);
  return successResponse({ updated: data });
});
