import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { TagService } from "@/lib/services/TagService";
import { TagInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("read:tags");
  const { id } = await params;
  const tag = await TagService.getTag(id);
  return successResponse(tag);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("update:tags");
  const { id } = await params;
  const data = TagInputSchema.parse(await req.json());
  const tag = await TagService.updateTag(id, data);
  return successResponse(tag);
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("delete:tags");
  const { id } = await params;
  await TagService.deleteTag(id);
  return successResponse({ success: true });
});
