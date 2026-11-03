import { handleRoute, jsonOk, requireAdmin } from "@/lib/api-server";
import { getAdminStats } from "@/lib/db";

/** GET /api/admin/stats — live platform counters (admin only). */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const stats = await getAdminStats();
    return jsonOk(stats, "Admin stats loaded.");
  });
}
