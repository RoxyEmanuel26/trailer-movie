import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { CollectionService } from "@/lib/services/CollectionService";

export const GET = apiHandler(async () => {
  await requireAdmin("read:collections");
  const collections = await CollectionService.listCollections();
  return successResponse(collections);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:collections");
  return successResponse({ message: "Not implemented" }, 201);
});
