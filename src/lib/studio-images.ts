/**
 * Shared studio image model and helpers.
 *
 * A studio keeps an ordered list of images. The first entry is the primary
 * (cover) image and is mirrored into the legacy flat `image` string so every
 * existing page, API consumer and booking snapshot keeps working without a
 * database migration:
 *
 *   {
 *     "images": [{ "url": "https://res.cloudinary.com/…", "source": "upload" },
 *                { "url": "https://example.com/studio.jpg", "source": "url" }],
 *     "image": "https://res.cloudinary.com/…"
 *   }
 *
 * Legacy documents that only carry `image` are normalized on read by
 * `getStudioImages` — no data migration required.
 *
 * This module is client-safe (no server-only imports): it is used by the
 * studio form, the image manager UI and the server validation.
 */

export type StudioImageSource = "upload" | "url";

export interface StudioImage {
  url: string;
  source: StudioImageSource;
}

/** Hard cap on images per studio (matches the amenities cap philosophy). */
export const MAX_STUDIO_IMAGES = 12;

/** Maximum upload size per image file. */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** MIME types accepted for uploads. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** File extensions accepted for uploads (JPG, JPEG, PNG, WEBP). */
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

/** Longest acceptable image URL (same limit as the legacy cover field). */
export const MAX_IMAGE_URL_LENGTH = 2048;

/**
 * A direct http(s) image URL — no whitespace, no `data:` URIs, length-capped.
 * Used by both the client (URL input + form submit) and the server validator.
 */
export function isValidImageUrl(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_IMAGE_URL_LENGTH &&
    /^https?:\/\/\S+$/i.test(value)
  );
}

/** File extension of an upload name, lowercase without the dot ("" if none). */
export function imageFileExtension(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1]!.toLowerCase() : "";
}

/** True when a File's MIME type or extension is an accepted image format. */
export function isAllowedImageType(file: { type: string; name: string }): boolean {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return true;
  }
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(
    imageFileExtension(file.name)
  );
}

/**
 * Strict parser for an `images` array coming from a request body. Returns a
 * sanitized list (trimmed, valid URLs only, known sources only) or null when
 * the value is not a usable list. Empty URLs are dropped so a partially
 * filled entry can never be persisted.
 */
export function normalizeStudioImageList(value: unknown): StudioImage[] | null {
  if (!Array.isArray(value)) return null;
  const images: StudioImage[] = [];
  for (const entry of value.slice(0, MAX_STUDIO_IMAGES)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { url?: unknown; source?: unknown };
    if (typeof record.url !== "string") continue;
    const url = record.url.trim();
    if (!isValidImageUrl(url)) continue;
    images.push({
      url,
      source: record.source === "upload" ? "upload" : "url",
    });
  }
  return images;
}

/**
 * Display-side normalizer: resolves the ordered image list of a studio from
 * either the new `images` array or the legacy flat `image` string, so pages
 * never need to know which shape a document uses.
 */
export function getStudioImages(studio: {
  image?: string | null;
  images?: unknown;
}): StudioImage[] {
  const normalized = normalizeStudioImageList(studio.images);
  if (normalized && normalized.length > 0) return normalized;
  const legacy = typeof studio.image === "string" ? studio.image.trim() : "";
  return legacy && isValidImageUrl(legacy) ? [{ url: legacy, source: "url" }] : [];
}

/** The primary (cover) image URL for display — "" when the studio has none. */
export function studioPrimaryImage(studio: {
  image?: string | null;
  images?: unknown;
}): string {
  const images = getStudioImages(studio);
  return images[0]?.url ?? "";
}
