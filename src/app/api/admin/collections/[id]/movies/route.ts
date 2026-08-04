import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { CollectionService } from "@/lib/services/CollectionService";
import { CollectionMoviesSchema } from "@/lib/api/schemas";

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin("update:collections");
  const { id } = await params;
  const data = CollectionMoviesSchema.parse(await req.json());
  
  const updatedCollection = await CollectionService.assignMovies(id, data.movieIds);
  return successResponse(updatedCollection);
});
