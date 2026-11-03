import { handleRoute, jsonOk, requireHost } from "@/lib/api-server";
import {
  countHostListings,
  findLatestHostApplication,
  listBookingRequestsForHost,
} from "@/lib/db";
import type { BookingRecord } from "@/types/booking";

/**
 * GET /api/hosts/me — dashboard payload for the signed-in host.
 *
 * Requires host or admin access (customers get 403 with a pointer to the
 * Become a Host onboarding). Every number is a live MongoDB count, and the
 * user identity is derived from the verified Better Auth session.
 */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireHost();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    const [application, listings, requests] = await Promise.all([
      findLatestHostApplication(auth.user.id),
      // Admins viewing the dashboard see the platform totals instead of an
      // empty personal list, so the counters still mean something.
      countHostListings(auth.user.id),
      listBookingRequestsForHost(auth.user.id),
    ]);

    const pendingRequests = requests.filter(
      (booking: BookingRecord) => booking.status === "pending"
    ).length;

    const hostSince = application?.createdAt ?? null;

    return jsonOk(
      {
        role: auth.role,
        user: {
          id: auth.user.id,
          name: auth.user.name,
          email: auth.user.email,
          phone: auth.user.phone,
        },
        businessName: application?.businessName ?? "",
        location: application?.location ?? "",
        hostingType: application?.hostingType ?? null,
        hostSince,
        application,
        stats: {
          totalListings: listings,
          activeListings: listings,
          totalRequests: requests.length,
          pendingRequests,
        },
        recentRequests: requests.slice(0, 5),
      },
      "Host profile loaded."
    );
  });
}
