import { handleRoute, jsonOk } from "@/lib/api-server";
import { listStudiosByCategory } from "@/lib/db";

/**
 * GET /api/categories/:category/studios — accepts a slug ("photo-studios"),
 * a title ("Photo Studios") or any stored category value.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  return handleRoute(async () => {
    const { category } = await params;
    const decoded = decodeURIComponent(category);
    const studios = await listStudiosByCategory(decoded);
    return jsonOk(studios, `Studios for ${decoded} loaded.`);
  });
}
