import { handleRoute, jsonOk, requireAdmin } from "@/lib/api-server";
import { listStudios, type StudioQuery } from "@/lib/db";

/** GET /api/admin/studios — every studio, including legacy/demo documents. */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const studios = await listStudios({} as StudioQuery);
    return jsonOk(studios, "All studios loaded.");
  });
}
