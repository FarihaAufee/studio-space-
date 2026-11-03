/**
 * Host onboarding types (backend `host_applications` collection and the
 * /api/hosts/* endpoints as returned by the StudioSpace backend).
 *
 * Application documents mirror the Become a Host form fields. `userId` is
 * derived server-side from the verified Better Auth session — never from the
 * request body — so identities cannot be spoofed.
 */
export interface HostApplication {
  _id: string;
  userId: string;
  /** Snapshot of the account email at application time (read-only source). */
  email: string;
  fullName: string;
  phone: string;
  businessName: string;
  location: string;
  introduction: string;
  hostingType: "individual" | "business";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

/** Effective roles used by the UI navigation and page gates. */
export type StudioRole = "customer" | "host" | "admin";

/** Response shape of GET /api/hosts/status — the navigation probe. */
export interface HostStatusResponse {
  role: StudioRole;
  isHost: boolean;
  isAdmin: boolean;
  application: HostApplication | null;
}

/** Daily snapshot of the /api/hosts/me payload used by the Host Dashboard. */
export interface HostProfile {
  role: StudioRole;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  businessName: string;
  location: string;
  hostingType: "individual" | "business" | null;
  hostSince: string | null;
  application: HostApplication | null;
  stats: {
    totalListings: number;
    activeListings: number;
    totalRequests: number;
    pendingRequests: number;
  };
  recentRequests: import("@/types/booking").BookingRecord[];
}
