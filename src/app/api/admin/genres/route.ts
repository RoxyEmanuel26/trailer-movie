import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { GenreService } from "@/lib/services/GenreService";
import { GenreInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async () => {
  await requireAdmin("read:genres");
  const genres = await GenreService.listGenres();
  return successResponse(genres);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:genres");
  const data = GenreInputSchema.parse(await request.json());
  const genre = await GenreService.createGenre(data);
  return successResponse(genre, 201);
});
