import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { MovieService } from "@/lib/services/MovieService";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireAdmin("read:movies");

  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || "50", 10);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const orderBy = { [sort]: order };

  const result = await MovieService.listMovies({
    skip, take, search, status, orderBy
  });
  
  return successResponse(result);
});

export const POST = apiHandler(async (request: NextRequest) => {
  await requireAdmin("create:movies");
  return successResponse({ message: "Manual creation not fully implemented. Use /imports." }, 201);
});
