import { handleRoute, jsonOk, requireUser } from "@/lib/api-server";
import { listMyBookings } from "@/lib/db";

/**
 * GET /api/bookings/my — booking history for the signed-in guest.
 * Matches bookings stamped with the session userId (and, for pre-session
 * legacy documents, the same account email). Sorted newest first.
 */
export async function GET() {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    const bookings = await listMyBookings(
      guard.auth.user.id,
      guard.auth.user.email
    );
    return jsonOk(bookings, "Your bookings loaded.");
  });
}
