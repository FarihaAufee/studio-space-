import { handleRoute, jsonOk, requireHost } from "@/lib/api-server";
import { listHostListings } from "@/lib/db";

/**
 * GET /api/hosts/listings — the signed-in host's own studio listings.
 *
 * Ownership is derived from the verified session: the query only ever
 * matches `hostId = <session user id>`. Legacy documents (no hostId) never
 * appear here — they remain admin-only manageable, so hosts cannot claim
 * them by fetching.
 */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireHost();
    if (!guard.ok) return guard.response;

    const listings = await listHostListings(guard.auth.user.id);
    return jsonOk(listings, "Listings loaded.");
  });
}
