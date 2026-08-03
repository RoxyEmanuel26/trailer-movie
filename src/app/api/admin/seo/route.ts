import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { SeoUpdateSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:seo");
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  
  // Future: SeoService.getSeoMetadata(entityId)
  return successResponse({ metaTitle: "Global Title" });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  await requireAdmin("update:seo");
  const body = await request.json();
  const data = SeoUpdateSchema.parse(body);

  // Future: SeoService.updateSeo(data)
  return successResponse({ updated: data });
});
