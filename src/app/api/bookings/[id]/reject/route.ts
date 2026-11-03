import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import {
  findBookingDocById,
  toBooking,
  transitionBookingStatus,
} from "@/lib/db";

/**
 * PATCH /api/bookings/:id/reject — host decision endpoint.
 *
 * Only the owner of the booked studio (hostId == session user id) or an
 * admin may reject. Valid transition: pending → cancelled (recorded as a
 * host rejection). Completed bookings can never be rejected; already
 * cancelled or confirmed requests return 409.
 */
export async function PATCH(
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

    const ownerId = (doc.hostId as string | undefined) ?? "";
    if (!ownerId) {
      if (!auth.isAdmin) {
        return jsonError(
          403,
          "This booking belongs to a legacy studio and can only be managed by an admin."
        );
      }
    } else if (ownerId !== auth.user.id && !auth.isAdmin) {
      return jsonError(404, "Booking not found.");
    }

    const current = (doc.status as string) ?? "pending";
    if (current === "cancelled") {
      return jsonError(409, "This request has already been rejected or cancelled.");
    }
    if (current === "completed") {
      return jsonError(409, "Completed sessions cannot be rejected.");
    }
    if (current === "confirmed") {
      return jsonError(
        409,
        "Approved requests cannot be rejected — ask the guest to cancel instead."
      );
    }

    const updated = await transitionBookingStatus(
      id,
      ["pending"],
      "cancelled",
      {
        cancelReason: "Rejected by host",
        rejectedByHost: true,
        cancelledAt: new Date(),
      }
    );

    if (!updated) {
      return jsonError(
        409,
        "The booking status changed while you were reviewing it. Refresh and try again."
      );
    }

    return jsonOk(toBooking(updated), "Request rejected — the guest will be notified.");
  });
}
