import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { CollectionService } from "@/lib/services/CollectionService";
import { CollectionInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:collections");
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const collections = await CollectionService.listCollections();
  const filtered = search
    ? collections.filter(
        (c) => c.title.toLowerCase().includes(search) || c.slug.toLowerCase().includes(search),
      )
    : collections;
  return successResponse(filtered);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("write:collections");
  const data = CollectionInputSchema.parse(await request.json());
  const collection = await CollectionService.createCollection(data);
  return successResponse(collection, 201);
});
