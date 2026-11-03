import { handleRoute, jsonOk } from "@/lib/api-server";
import { findStudioById } from "@/lib/db";

/** GET /api/studios/:id — one studio (legacy string ids still resolve). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await params;
    const studio = await findStudioById(id);
    if (!studio) {
      return Response.json(
        { success: false, message: "Studio not found." },
        { status: 404 }
      );
    }
    return jsonOk(studio, "Studio loaded.");
  });
}
