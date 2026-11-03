import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import { findBookingDocById, toBooking } from "@/lib/db";

/**
 * GET /api/bookings/:id — one booking.
 *
 * Visible to the guest who made it (userId or email match on legacy docs),
 * the host of the booked studio, or an admin. Anyone else gets 404 so
 * foreign bookings are indistinguishable from missing ones.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;
    const { id } = await params;

    const doc = await findBookingDocById(id);
    if (!doc) {
      return jsonError(404, "Booking not found.");
    }

    const booking = toBooking(doc);
    const isGuest =
      (doc.userId as string | undefined) === auth.user.id ||
      ((doc.email as string | undefined)?.toLowerCase() ?? "") ===
        auth.user.email.toLowerCase();
    const isStudioHost = (doc.hostId as string | undefined) === auth.user.id;

    if (!isGuest && !isStudioHost && !auth.isAdmin) {
      return jsonError(404, "Booking not found.");
    }

    return jsonOk(booking, "Booking loaded.");
  });
}
