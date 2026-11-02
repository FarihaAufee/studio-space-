/**
 * Shared booking record shape (backend `bookings` collection as returned by
 * the booking APIs). Booking documents snapshot the studio fields they price,
 * so history stays accurate even if the studio changes later.
 */
export interface BookingRecord {
  _id: string;
  studioId: string;
  studioTitle?: string;
  studioImage?: string;
  studioLocation?: string;
  hourlyRate?: number;
  securityDeposit?: number;
  maxCapacity?: number;
  bookingDate: string;
  timeSlot: string;
  guests: number;
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  cancelReason?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Formats a booking date (YYYY-MM-DD or ISO) as "Nov 15, 2026". */
export function formatBookingDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats an ISO timestamp for the timeline ("31 Oct 2026, 14:00"). */
export function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
