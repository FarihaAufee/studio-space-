import { handleRoute, jsonError, jsonOk, requireUser } from "@/lib/api-server";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedImageType,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/studio-images";
import { isCloudinaryConfigured, uploadStudioImage } from "@/lib/cloudinary";

/**
 * POST /api/studios/images — uploads one studio photo to Cloudinary.
 *
 * Security model:
 *  - Host authorization is required (`requireUser` + host/admin role, the
 *    same gate as POST /api/studios) — customers cannot upload.
 *  - The file is validated server-side: allowed MIME type or extension
 *    (JPG/JPEG/PNG/WEBP) and a hard 5 MB size cap — client checks are UX
 *    only and are never trusted.
 *  - The body must be multipart/form-data with one file under `file`.
 *  - Cloudinary credentials stay server-side; the browser only ever
 *    receives the hosted https URL.
 *
 * Returns `{ url, publicId, source: "upload" }` for the form's image manager.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;

    if (!guard.auth.isHost) {
      return jsonError(
        403,
        "Only hosts can upload studio images. Complete the Become a Host onboarding first."
      );
    }

    if (!isCloudinaryConfigured()) {
      return jsonError(
        503,
        "Image uploads are not configured on this server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the environment to enable them."
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(400, "Upload must be sent as multipart form data.");
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return jsonError(400, "Select an image file to upload.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return jsonError(
        400,
        "Image is too large. Maximum size is 5 MB per image."
      );
    }
    if (file.size === 0) {
      return jsonError(400, "The selected file is empty.");
    }

    // MIME type first, extension as fallback (browsers set MIME on real
    // files; the extension covers senders that report a generic type).
    const mimeOk = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
      file.type
    );
    const extensionOk = isAllowedImageType({ type: file.type, name: file.name });
    if (!mimeOk && !extensionOk) {
      return jsonError(
        400,
        "Only JPG, JPEG, PNG or WEBP images can be uploaded."
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extra safety against mislabelled content: verify the magic bytes
    // (JPEG FF D8 FF, PNG 89 50 4E 47, WEBP RIFF....WEBP).
    if (!hasSupportedImageMagic(buffer)) {
      return jsonError(
        400,
        "This file does not look like a JPG, PNG or WEBP image."
      );
    }

    try {
      const uploaded = await uploadStudioImage(buffer);
      return jsonOk(
        { url: uploaded.url, publicId: uploaded.publicId, source: "upload" as const },
        "Image uploaded."
      );
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      return jsonError(
        502,
        "Image upload failed on our side. Please try again in a moment."
      );
    }
  });
}

/** Magic-byte sniffing so a renamed .exe posing as .jpg is rejected. */
function hasSupportedImageMagic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // WEBP: "RIFF" .... "WEBP"
  const riff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const webp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return riff && webp;
}
