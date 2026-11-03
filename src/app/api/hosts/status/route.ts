import { handleRoute, jsonOk, requireUser } from "@/lib/api-server";
import { findLatestHostApplication } from "@/lib/db";

/**
 * GET /api/hosts/status — role check used by navigation and page gates.
 *
 * Works for every signed-in user: customers see their role (plus a pending
 * application when one exists), hosts and admins see theirs. Unauthenticated
 * visitors get 401 with no providers or secrets in the payload.
 */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    // Customers may have a pending application to resume; hosts/admins
    // rarely do, but the lookup is cheap and keeps one code path.
    const application = await findLatestHostApplication(auth.user.id);

    return jsonOk(
      {
        role: auth.role,
        isHost: auth.isHost,
        isAdmin: auth.isAdmin,
        application,
      },
      "Status loaded."
    );
  });
}
