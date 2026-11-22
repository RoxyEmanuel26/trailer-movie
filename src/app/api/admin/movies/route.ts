import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { AdminMovieListQuerySchema } from "@/lib/api/schemas";
import { requireAdmin } from "@/lib/auth/utils";
import { MovieService } from "@/lib/services/MovieService";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:movies");

  const { searchParams } = new URL(request.url);
  const parsed = AdminMovieListQuerySchema.parse({
    skip: searchParams.get("skip") || undefined,
    take: searchParams.get("take") || undefined,
    search: searchParams.get("search") || searchParams.get("query") || undefined,
    status: searchParams.get("status") || undefined,
    sort: searchParams.get("sort") || undefined,
    order: searchParams.get("order") || undefined,
  });

  const orderBy = { [parsed.sort]: parsed.order };

  const result = await MovieService.adminListMovies({
    skip: parsed.skip,
    take: parsed.take,
    search: parsed.search,
    status: parsed.status,
    orderBy,
  });

  return successResponse(result);
});

export const POST = apiHandler(async () => {
  await requireAdmin("write:movies");
  return successResponse({ message: "Manual creation not fully implemented. Use /imports." }, 201);
});
