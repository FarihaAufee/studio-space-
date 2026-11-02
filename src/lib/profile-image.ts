/**
 * Client-side profile photo pipeline.
 *
 * Converts a user-selected image file into a compact square-cropped JPEG data
 * URL that Better Auth stores on the user record. Cropping and resizing in the
 * browser avoids large uploads, and the resulting data URL stays small enough
 * to be returned comfortably inside the session payload.
 */

const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.8;

export async function resizeImageFile(
  file: File,
  maxDimension: number = MAX_DIMENSION,
  quality: number = JPEG_QUALITY
): Promise<string> {
  const bitmap = await createImageBitmap(file);

  // Crop to a centered square, then scale down to the max dimension.
  const side = Math.min(bitmap.width, bitmap.height);
  const offsetX = (bitmap.width - side) / 2;
  const offsetY = (bitmap.height - side) / 2;
  const scale = Math.min(1, maxDimension / side);
  const size = Math.max(1, Math.round(side * scale));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error(
      "Your browser could not process the photo. Please try a different image."
    );
  }
  context.drawImage(bitmap, offsetX, offsetY, side, side, 0, 0, size, size);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl.startsWith("data:image/jpeg")) {
    throw new Error(
      "We could not process that image. Please try a JPG or PNG photo."
    );
  }
  return dataUrl;
}
