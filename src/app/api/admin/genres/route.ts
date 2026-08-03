import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { GenreService } from "@/lib/services/GenreService";

export const GET = apiHandler(async () => {
  await requireAdmin("read:genres");
  const genres = await GenreService.listGenres();
  return successResponse(genres);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:genres");
  // const data = GenreUpdateSchema.parse(await request.json());
  return successResponse({ message: "Not implemented" }, 201);
});
