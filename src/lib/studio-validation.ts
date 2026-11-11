import { CATEGORIES } from "@/data/categories";
import {
  isValidImageUrl,
  normalizeStudioImageList,
  type StudioImage,
} from "@/lib/studio-images";

/**
 * Shared, server-only payload validation for studio create/update requests
 * (used by POST /api/studios, PUT /api/hosts/listings/:id and the admin
 * endpoints). Mirrors the StudioForm rules so field-level messages line up
 * with the client.
 */

export interface StudioDetailPayload {
  title: string;
  category: string;
  location: string;
  address: string;
  /** Legacy cover image — kept in sync with images[0] for compatibility. */
  image: string;
  /** Ordered image list; images[0] is the primary/cover image. */
  images: StudioImage[];
  overview: string;
  hourlyRate: number;
  securityDeposit?: number;
  maxCapacity: number;
  amenities: string[];
}

/** Parses and validates the JSON body of a studio mutation. */
export function parseStudioPayload(
  body: Record<string, unknown>
):
  | { ok: true; value: StudioDetailPayload }
  | { ok: false; errors: Record<string, string>; message: string } {
  const errors: Record<string, string> = {};

  const title = stringOf(body.title);
  if (!title || title.length < 3 || title.length > 100) {
    errors.title = "Studio title is required (3–100 characters).";
  }

  const category = stringOf(body.category);
  if (!category || !CATEGORIES.some((item) => item.title === category)) {
    errors.category = "Choose one of the listed studio categories.";
  }

  const location = stringOf(body.location);
  if (!location || location.length < 2 || location.length > 120) {
    errors.location = "City / area is required (2–120 characters).";
  }

  const address = stringOf(body.address);
  if (!address || address.length < 8 || address.length > 200) {
    errors.address = "Full address is required (8–200 characters).";
  }

  const image = stringOf(body.image);

  /**
   * Dual image input (backward compatible):
   *  - `images`: the ordered list [{ url, source: "upload" | "url" }].
   *  - `image`: the legacy flat cover URL — accepted alone (old clients)
   *    and used as the fallback when `images` is missing/empty.
   * The list is sanitized: valid http(s) URLs only, empty entries dropped.
   */
  let images = normalizeStudioImageList(body.images) ?? [];
  if (images.length === 0 && image && isValidImageUrl(image)) {
    images = [{ url: image, source: "url" }];
  }
  if (images.length === 0) {
    errors.image =
      "Add at least one image — upload a photo or paste a direct http(s) image URL.";
  } else if (images.length > 12) {
    errors.image = "A studio can hold at most 12 images.";
  }

  const overview = stringOf(body.overview);
  if (!overview || overview.length < 30 || overview.length > 2000) {
    errors.overview = "Describe the studio at least in a sentence (30–2000 characters).";
  }

  let hourlyRate: number | undefined;
  if (typeof body.hourlyRate === "number" && Number.isFinite(body.hourlyRate)) {
    hourlyRate = body.hourlyRate;
  } else if (typeof body.hourlyRate === "string" && body.hourlyRate.trim()) {
    const parsed = Number(body.hourlyRate);
    if (Number.isFinite(parsed)) hourlyRate = parsed;
  } else if (typeof body.hourlyRate !== "number" && typeof body.hourlyRate !== "string") {
    hourlyRate = undefined;
  }
  if (
    hourlyRate === undefined ||
    hourlyRate <= 0 ||
    hourlyRate > 1_000_000
  ) {
    errors.hourlyRate = "Hourly rate must be a number between 1 and 1000000.";
  }

  let securityDeposit: number | undefined;
  if (
    body.securityDeposit === undefined ||
    body.securityDeposit === null ||
    body.securityDeposit === ""
  ) {
    securityDeposit = undefined;
  } else {
    const parsed =
      typeof body.securityDeposit === "number"
        ? body.securityDeposit
        : Number(body.securityDeposit);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000) {
      errors.securityDeposit = "Security deposit must be zero or more.";
    } else {
      securityDeposit = parsed;
    }
  }

  let maxCapacity: number | undefined;
  if (typeof body.maxCapacity === "number" && Number.isFinite(body.maxCapacity)) {
    maxCapacity = body.maxCapacity;
  } else if (typeof body.maxCapacity === "string" && body.maxCapacity.trim()) {
    const parsed = Number(body.maxCapacity);
    if (Number.isFinite(parsed)) maxCapacity = parsed;
  }
  if (
    maxCapacity === undefined ||
    !Number.isInteger(maxCapacity) ||
    maxCapacity < 1 ||
    maxCapacity > 500
  ) {
    errors.maxCapacity = "Max guests must be a whole number between 1 and 500.";
  }

  let amenities: string[] = [];
  if (Array.isArray(body.amenities)) {
    amenities = body.amenities
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (amenities.some((item) => item.length > 48)) {
      errors.amenities = "Each amenity must be 48 characters or fewer.";
    }
  } else {
    errors.amenities = "Amenities must be a list.";
  }

  if (Object.keys(errors).length > 0) {
    const first = Object.values(errors)[0] ?? "Please check the highlighted fields.";
    return { ok: false, errors, message: first };
  }

  // Having passed validation, each string field above is a non-null
  // trimmed string (any null would have produced an error entry); TS
  // cannot infer that from the errors bookkeeping — narrowed here.
  return {
    ok: true,
    value: {
      title: title as string,
      category: category as string,
      location: location as string,
      address: address as string,
      images,
      // The flat cover field stays in sync with the ordered list so legacy
      // readers (and booking snapshots) keep working. Validation guarantees
      // a non-empty list here.
      image: images[0]!.url,
      overview: overview as string,
      hourlyRate: Number(hourlyRate),
      ...(securityDeposit !== undefined ? { securityDeposit } : {}),
      maxCapacity: Number(maxCapacity),
      amenities,
    },
  };
}

function stringOf(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}
