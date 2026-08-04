import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { TagService } from "@/lib/services/TagService";
import { BulkIdsSchema } from "@/lib/api/schemas";

export const DELETE = apiHandler(async (req: NextRequest) => {
  await requireAdmin("delete:tags");
  const data = BulkIdsSchema.parse(await req.json());
  const result = await TagService.deleteMany(data.ids);
  return successResponse({ count: result.count });
});
