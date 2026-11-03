import { ObjectId } from "mongodb";
import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import {
  createBookingDoc,
  findStudioDocById,
  toBooking,
} from "@/lib/db";

/**
 * POST /api/bookings — guest booking request.
 *
 *  - Requires a signed-in customer or host (hosts may book other studios).
 *  - The studio must exist; the guest count is validated against its
 *    capacity and the date must be today or later.
 *  - The booking owner (userId) is stamped from the verified session — the
 *    body can suggest contact details, never the identity.
 *  - Studio snapshot fields (including hostId/hostName/hostEmail) come
 *    from the stored studio document, so booking history stays accurate
 *    when the studio changes later.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const auth = guard.auth;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError(400, "Invalid request body.");
    }

    const errors: Record<string, string> = {};

    const studioId = typeof body.studioId === "string" ? body.studioId.trim() : "";
    if (!studioId || !/^[0-9a-fA-F]{24}$/.test(studioId)) {
      return jsonError(400, "A valid studio must be selected.");
    }

    const bookingDate =
      typeof body.bookingDate === "string" ? body.bookingDate.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      errors.bookingDate = "Choose a booking date.";
    } else {
      const chosen = new Date(`${bookingDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(chosen.getTime()) || chosen < today) {
        errors.bookingDate = "Choose a date in the future.";
      }
    }

    const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : "";
    if (!timeSlot || timeSlot.length > 40) {
      errors.timeSlot = "Choose a valid time slot.";
    }

    const guests =
      typeof body.guests === "number"
        ? body.guests
        : typeof body.guests === "string"
          ? Number(body.guests)
          : NaN;
    if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
      errors.guests = "Guests must be a whole number between 1 and 50.";
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!fullName || fullName.length < 2 || fullName.length > 80) {
      errors.fullName = "Your full name is required (2–80 characters).";
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 200) {
      errors.email = "A valid email for confirmations is required.";
    }

    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (phone && (phone.length < 6 || phone.length > 20)) {
      errors.phone = "Phone number must be 6–20 characters.";
    }

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (notes.length > 1000) {
      errors.notes = "Notes can be up to 1000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      return Response.json(
        {
          success: false,
          message: "Please review your booking details.",
          errors,
        },
        { status: 400 }
      );
    }

    const studio = await findStudioDocById(studioId);
    if (!studio) {
      return jsonError(404, "This studio is no longer listed.");
    }

    const maxCapacity =
      typeof studio.maxCapacity === "number" && studio.maxCapacity > 0
        ? Number(studio.maxCapacity)
        : null;
    if (maxCapacity !== null && guests > maxCapacity) {
      return jsonError(400, `This studio hosts up to ${maxCapacity} guests.`);
    }

    const doc = await createBookingDoc({
      _id: new ObjectId(),
      // Booking owner from the verified session — never from the body.
      userId: auth.user.id,
      studioId: String(studio._id).trim() || studioId,
      studioTitle: studio.title ?? "",
      studioImage: studio.image ?? "",
      studioLocation: studio.location ?? "",
      studioCategory: studio.category ?? "",
      hourlyRate: typeof studio.hourlyRate === "number" ? studio.hourlyRate : 0,
      securityDeposit: typeof studio.securityDeposit === "number" ? studio.securityDeposit : 0,
      maxCapacity: typeof studio.maxCapacity === "number" ? studio.maxCapacity : undefined,
      hostId: typeof studio.hostId === "string" ? studio.hostId : undefined,
      hostName: studio.hostName ?? "",
      hostEmail: studio.hostEmail ?? "",
      bookingDate,
      timeSlot,
      guests,
      fullName,
      email,
      ...(phone ? { phone } : {}),
      ...(notes ? { notes } : {}),
      cancelReason: null,
    });

    return jsonOk(
      toBooking(doc),
      "Booking requested! You can follow it in My Bookings.",
      201
    );
  });
}
