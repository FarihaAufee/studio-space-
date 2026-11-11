import { v2 as cloudinary } from "cloudinary";

/**
 * Server-only Cloudinary configuration for studio image uploads.
 *
 * Credentials are read exclusively from server-side environment variables
 * (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) —
 * they are never sent to or read by the browser. Uploads always go through
 * the StudioSpace API route (POST /api/studios/images), never directly from
 * the client to Cloudinary.
 *
 * `isCloudinaryConfigured()` lets the upload route answer with a helpful,
 * actionable error message instead of failing cryptically when the
 * integration has not been set up yet.
 */

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/** True when all three required Cloudinary credentials are present. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/** Folder inside the Cloudinary cloud where studio photos are stored. */
export const STUDIO_IMAGE_FOLDER = "studio-space/studios";

export interface UploadedStudioImage {
  url: string;
  /** Cloudinary public_id, kept to allow future deletion of stale images. */
  publicId?: string;
}

/**
 * Uploads one already-validated image buffer to Cloudinary.
 * Throws when Cloudinary rejects the upload (surfaced to the caller as a
 * 502 by the API route).
 */
export async function uploadStudioImage(
  buffer: Buffer
): Promise<UploadedStudioImage> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: STUDIO_IMAGE_FOLDER,
          // Metadata derived from the validated upload (unique public id).
          use_filename: false,
          unique_filename: true,
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url) {
            reject(error ?? new Error("Cloudinary returned no URL."));
            return;
          }
          resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
        }
      );
      stream.end(buffer);
    }
  );
  return { url: result.secure_url, publicId: result.public_id };
}
