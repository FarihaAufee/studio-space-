import { handleRoute, jsonOk, requireUser } from "@/lib/api-server";
import { findStudioById } from "@/lib/db";

/**
 * GET /api/studios/:id — one studio (legacy string ids still resolve).
 *
 * Studio details are members-only (mirrors the /studios/:id page gate):
 * unauthenticated callers get 401 while the listing/featured/category
 * endpoints stay public for the homepage and gallery.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

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
