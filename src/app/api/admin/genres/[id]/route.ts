import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { GenreService } from "@/lib/services/GenreService";
import { GenreInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("read:genres");
  const { id } = await params;
  const genre = await GenreService.getGenre(id);
  return successResponse(genre);
});

export const PUT = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("update:genres");
  const { id } = await params;
  const data = GenreInputSchema.parse(await req.json());
  const genre = await GenreService.updateGenre(id, data);
  return successResponse(genre);
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: any) => {
  await requireAdmin("delete:genres");
  const { id } = await params;
  await GenreService.deleteGenre(id);
  return successResponse({ success: true });
});
