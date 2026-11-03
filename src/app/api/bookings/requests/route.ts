import { handleRoute, jsonOk, requireUser } from "@/lib/api-server";
import { listBookingRequestsForHost, listAllBookings } from "@/lib/db";

/**
 * GET /api/bookings/requests — booking requests across the signed-in
 * host's studios (managable inbox), newest first. Host must be active.
 * Admins receive the platform-wide list.
 */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    if (!auth.isHost) {
      return Response.json(
        {
          success: false,
          message:
            "Booking requests are available to hosts and admins only. Complete the Become a Host onboarding to receive requests.",
        },
        { status: 403 }
      );
    }

    const requests = auth.isAdmin
      ? await listAllBookings()
      : await listBookingRequestsForHost(auth.user.id);

    return jsonOk(requests, "Booking requests loaded.");
  });
}
