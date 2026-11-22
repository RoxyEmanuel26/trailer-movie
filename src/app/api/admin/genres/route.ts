import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { GenreService } from "@/lib/services/GenreService";
import { GenreInputSchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:genres");
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const genres = await GenreService.listGenres();
  const filtered = search
    ? genres.filter(
        (g) => g.name.toLowerCase().includes(search) || g.slug.toLowerCase().includes(search),
      )
    : genres;
  return successResponse(filtered);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("write:genres");
  const data = GenreInputSchema.parse(await request.json());
  const genre = await GenreService.createGenre(data);
  return successResponse(genre, 201);
});
