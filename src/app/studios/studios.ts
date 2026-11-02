/**
 * Shared Studio shape returned by the StudioSpace backend
 * (`GET /api/studios`, `GET /api/categories/:category/studios`, ...).
 *
 * Core fields are always present on fresh documents; the optional fields
 * cover legacy documents and server-side defaults so every page renders
 * defensively.
 */
export interface Studio {
  _id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  hourlyRate: number;
  securityDeposit?: number;
  maxCapacity?: number;
  amenities?: string[];
  /** Free-text description. Newer documents use `overview`. */
  description?: string;
  overview?: string;
  address?: string;
  /** Ownership fields — managed server-side, never edited from the client. */
  hostId?: string;
  hostName?: string;
  hostEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Booking status values used across listing/detail/request pages. */
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
