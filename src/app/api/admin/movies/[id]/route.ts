import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { MovieService } from "@/lib/services/MovieService";
import { MovieAdminUpdateSchema } from "@/lib/api/schemas";

export const PATCH = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("update:movies");
  
  const { id } = await params;
  const body = await request.json();
  const data = MovieAdminUpdateSchema.parse(body);

  const updated = await MovieService.updateMovie(id, data);
  return successResponse({ updatedId: id, data: updated });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("delete:movies");
  const { id } = await params;
  await MovieService.deleteMovie(id);
  return successResponse({ deleted: true });
});
