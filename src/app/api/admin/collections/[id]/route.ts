import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { CollectionService } from "@/lib/services/CollectionService";
import { CollectionInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("read:collections");
  const { id } = await params;
  const collection = await CollectionService.getCollection(id);
  return successResponse(collection);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("update:collections");
  const { id } = await params;
  const data = CollectionInputSchema.parse(await req.json());
  const collection = await CollectionService.updateCollection(id, data);
  return successResponse(collection);
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("delete:collections");
  const { id } = await params;
  await CollectionService.deleteCollection(id);
  return successResponse({ success: true });
});
