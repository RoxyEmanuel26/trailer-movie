import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { TagService } from "@/lib/services/TagService";
import { TagInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async () => {
  await requireAdmin("read:tags");
  const tags = await TagService.listTags();
  return successResponse(tags);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:tags");
  const data = TagInputSchema.parse(await request.json());
  const tag = await TagService.createTag(data);
  return successResponse(tag, 201);
});
