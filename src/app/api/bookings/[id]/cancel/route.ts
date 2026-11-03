import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import { findBookingDocById, toBooking, transitionBookingStatus } from "@/lib/db";

/**
 * PATCH /api/bookings/:id/cancel — guest-initiated cancellation.
 *
 * Only the booking's own guest (or an admin) may cancel. Valid
 * transitions: pending|confirmed → cancelled. Cancelled and completed
 * bookings return 409 with the current state explained.
 */
export async function PATCH(
  request: Request,
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

    const isGuest =
      (doc.userId as string | undefined) === auth.user.id ||
      ((doc.email as string | undefined)?.toLowerCase() ?? "") ===
        auth.user.email.toLowerCase();
    if (!isGuest && !auth.isAdmin) {
      return jsonError(404, "Booking not found.");
    }

    const current = (doc.status as string) ?? "pending";
    if (current === "cancelled") {
      return jsonError(409, "This booking is already cancelled.");
    }
    if (current === "completed") {
      return jsonError(409, "Completed sessions cannot be cancelled.");
    }

    let cancelReason: string | undefined;
    try {
      const body = (await request.json()) as Record<string, unknown>;
      if (typeof body.cancelReason === "string" && body.cancelReason.trim()) {
        cancelReason = body.cancelReason.trim().slice(0, 500);
      }
    } catch {
      cancelReason = undefined;
    }

    const updated = await transitionBookingStatus(
      id,
      ["pending", "confirmed"],
      "cancelled",
      {
        cancelReason: cancelReason ?? null,
        cancelledAt: new Date(),
      }
    );

    if (!updated) {
      // A concurrent transition changed the status between the read and the
      // write — surface the conflict instead of a silent overwrite.
      return jsonError(
        409,
        "The booking status changed while you were viewing it. Refresh and try again."
      );
    }

    return jsonOk(toBooking(updated), "Booking cancelled.");
  });
}
