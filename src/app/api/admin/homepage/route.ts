import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";

export const GET = apiHandler(async () => {
  await requireAdmin("read:homepage");
  return successResponse({ featured: [], banner: {} });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  await requireAdmin("update:homepage");
  return successResponse({ message: "Homepage updated" });
});
