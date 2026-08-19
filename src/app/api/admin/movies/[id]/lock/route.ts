import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/utils";

export const POST = apiHandler(async (request: NextRequest, { params }: any) => {
  await requireAdmin("update:movies");
  const { id } = await params;
  const { fields } = await request.json();
  
  // Future: MovieService.lockFields(id, fields);
  return successResponse({ locked: true, id, fields });
});
