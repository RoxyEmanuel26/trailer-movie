import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { CollectionService } from "@/lib/services/CollectionService";
import { BulkIdsSchema, BulkStatusSchema, BulkFeaturedSchema } from "@/lib/api/schemas";

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireAdmin("update:collections");
  const body = await req.json();
  
  if (body.isActive !== undefined) {
    const data = BulkStatusSchema.parse(body);
    const result = await CollectionService.updateStatus(data.ids, data.isActive);
    return successResponse({ count: result.count });
  }
  
  if (body.isFeatured !== undefined) {
    const data = BulkFeaturedSchema.parse(body);
    const result = await CollectionService.updateFeatured(data.ids, data.isFeatured);
    return successResponse({ count: result.count });
  }

  return successResponse({ message: "Invalid bulk operation" }, 400);
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  await requireAdmin("delete:collections");
  const data = BulkIdsSchema.parse(await req.json());
  const result = await CollectionService.deleteMany(data.ids);
  return successResponse({ count: result.count });
});
