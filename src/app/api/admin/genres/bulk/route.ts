import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { GenreService } from "@/lib/services/GenreService";
import { BulkIdsSchema } from "@/lib/api/schemas";

export const DELETE = apiHandler(async (req: NextRequest) => {
  await requireAdmin("delete:genres");
  const data = BulkIdsSchema.parse(await req.json());
  const result = await GenreService.deleteMany(data.ids);
  return successResponse({ count: result.count });
});
