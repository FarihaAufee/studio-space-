import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import {
  findBookingDocById,
  toBooking,
  transitionBookingStatus,
} from "@/lib/db";

/**
 * PATCH /api/bookings/:id/approve — host decision endpoint.
 *
 * Only the owner of the booked studio (hostId == session user id) or an
 * admin may approve. Valid transition: pending → confirmed. Anything else
 * (already confirmed / completed / cancelled) returns 409 with a clear
 * message — cancelled bookings can never be approved.
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
      // Legacy booking whose studio has no linked host — admin territory.
      if (!auth.isAdmin) {
        return jsonError(
          403,
          "This booking belongs to a legacy studio and can only be managed by an admin."
        );
      }
    } else if (ownerId !== auth.user.id && !auth.isAdmin) {
      // A host cannot approve or reject another host's bookings — hidden
      // as 404 rather than confirming existence.
      return jsonError(404, "Booking not found.");
    }

    const current = (doc.status as string) ?? "pending";
    if (current === "confirmed") {
      return jsonError(409, "This request has already been approved.");
    }
    if (current === "cancelled") {
      return jsonError(409, "Cancelled bookings cannot be approved.");
    }
    if (current === "completed") {
      return jsonError(409, "Completed sessions cannot be approved again.");
    }

    const updated = await transitionBookingStatus(
      id,
      ["pending"],
      "confirmed",
      {}
    );

    if (!updated) {
      return jsonError(
        409,
        "The booking status changed while you were reviewing it. Refresh and try again."
      );
    }

    return jsonOk(toBooking(updated), "Request approved — the guest will be notified.");
  });
}
