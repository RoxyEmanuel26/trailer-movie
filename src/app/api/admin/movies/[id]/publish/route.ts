import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";
import { MovieService } from "@/lib/services/MovieService";

export const POST = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("update:movies");
  const id = params.id as string;
  
  const result = await MovieService.publishMovie(id);
  return successResponse({ published: true, id: result.id });
});
