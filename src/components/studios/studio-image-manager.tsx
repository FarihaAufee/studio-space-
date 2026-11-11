"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  ImagePlus,
  Plus,
  Star,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";
// The type `StudioImage` comes from lib/studio-images below; alias the
// component to avoid the name collision.
import { StudioImage as StudioImageFrame } from "@/components/studios/studio-image";
import {
  getStudioImages,
  isAllowedImageType,
  isValidImageUrl,
  MAX_IMAGE_SIZE_BYTES,
  MAX_STUDIO_IMAGES,
  type StudioImage,
} from "@/lib/studio-images";

/**
 * Dual studio image manager used by the shared studio form.
 *
 * Two input options feed one ordered list:
 *  1. Upload images — drag & drop (or browse) straight to the server, which
 *     validates each file and stores it on Cloudinary (per-file progress).
 *  2. Add image URL — paste a direct link to an externally hosted image
 *     (the original single-image flow, retained and extended).
 *
 * Images are previewed before saving. The first image is the primary/cover
 * image (mirrored into the legacy `image` field on save); hosts can reorder,
 * remove and promote any image.
 */

const dropzoneClasses =
  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

const urlInputClasses =
  "h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-60";

interface UploadJob {
  key: string;
  name: string;
  progress: number;
}

interface StudioImageManagerProps {
  /** Ordered image list — index 0 is the primary/cover image. */
  value: StudioImage[];
  onChange: (images: StudioImage[]) => void;
  /** Disabled while the studio form is submitting. */
  disabled?: boolean;
}

export function StudioImageManager({
  value,
  onChange,
  disabled = false,
}: StudioImageManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Latest images/onChange for the async upload closures, synced after each
  // commit (XHR onload runs post-commit, so the refs are always current).
  const imagesRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    imagesRef.current = value;
    onChangeRef.current = onChange;
  });

  const images = getStudioImages({ images: value });

  const removeUpload = (key: string) =>
    setUploads((current) => current.filter((job) => job.key !== key));

  /** Server upload of one pre-validated file with XHR progress events. */
  const uploadFile = useCallback(
    (file: File, key: string) =>
      new Promise<void>((resolve) => {
        const body = new FormData();
        body.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/studios/images`);
        // Session cookie must ride along — the upload route is host-gated.
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploads((current) =>
            current.map((job) => (job.key === key ? { ...job, progress } : job))
          );
        };

        const finish = (handler: () => void) => {
          removeUpload(key);
          handler();
          resolve();
        };

        xhr.onload = () =>
          finish(() => {
            void (async () => {
              // parseApiResponse expects a fetch Response interface.
              const response = new Response(xhr.responseText, {
                status: xhr.status,
                headers: { "content-type": "application/json" },
              });
              const result = await parseApiResponse(response);
              if (result.ok && typeof (result.data as { url?: unknown })?.url === "string") {
                const url = (result.data as { url: string }).url;
                const used = getStudioImages({ images: imagesRef.current }).length;
                if (used < MAX_STUDIO_IMAGES) {
                  onChangeRef.current([
                    ...getStudioImages({ images: imagesRef.current }),
                    { url, source: "upload" },
                  ]);
                  toast.success(`Uploaded ${file.name}.`);
                  return;
                }
              }
              toast.error(result.message || `Could not upload ${file.name}.`);
            })();
          });

        xhr.onerror = () =>
          finish(() => toast.error(`Network error while uploading ${file.name}.`));
        xhr.ontimeout = () =>
          finish(() => toast.error(`Upload of ${file.name} timed out. Please try again.`));

        xhr.send(body);
      }),
    []
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const accepted: File[] = [];
      for (const file of incoming) {
        if (!isAllowedImageType(file)) {
          toast.error(`${file.name}: only JPG, JPEG, PNG or WEBP images are allowed.`);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(`${file.name} is too large — the maximum is 5 MB per image.`);
          continue;
        }
        if (file.size === 0) {
          toast.error(`${file.name} is empty.`);
          continue;
        }
        accepted.push(file);
      }

      const used = getStudioImages({ images: imagesRef.current }).length;
      const room = MAX_STUDIO_IMAGES - used - uploads.length;
      if (room <= 0) {
        toast.error(`A studio can hold at most ${MAX_STUDIO_IMAGES} images.`);
        return;
      }
      if (accepted.length > room) {
        toast.error(`Only ${room} more image${room === 1 ? "" : "s"} can be added.`);
        accepted.length = room;
      }
      if (accepted.length === 0) return;

      accepted.forEach((file) => {
        const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setUploads((current) => [...current, { key, name: file.name, progress: 0 }]);
        void uploadFile(file, key);
      });
    },
    [uploads.length, uploadFile]
  );

  const addImageUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (!isValidImageUrl(url)) {
      toast.error("Enter a direct http(s) link to an image (max 2048 characters).");
      return;
    }
    const current = getStudioImages({ images: imagesRef.current });
    if (current.some((image) => image.url.toLowerCase() === url.toLowerCase())) {
      toast.error("That image URL is already in the list.");
      return;
    }
    if (current.length >= MAX_STUDIO_IMAGES) {
      toast.error(`A studio can hold at most ${MAX_STUDIO_IMAGES} images.`);
      return;
    }
    onChangeRef.current([...current, { url, source: "url" }]);
    setUrlDraft("");
    toast.success("Image link added.");
  };

  const removeImage = (index: number) => {
    onChangeRef.current(
      getStudioImages({ images: imagesRef.current }).filter((_, i) => i !== index)
    );
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const current = getStudioImages({ images: imagesRef.current });
    const next = [...current];
    const [image] = next.splice(index, 1);
    next.unshift(image!);
    onChangeRef.current(next);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const current = getStudioImages({ images: imagesRef.current });
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    const [image] = next.splice(index, 1);
    next.splice(target, 0, image!);
    onChangeRef.current(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Option 1 — upload from this device */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload studio images: drag and drop or browse"
        className={`${dropzoneClasses} ${disabled ? "pointer-events-none opacity-60" : ""} ${dragActive ? "border-primary bg-primary/5" : ""}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled) return;
          if (event.dataTransfer.files.length > 0) handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="flex size-10 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <Upload className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">
          Drag & drop images here, or click to browse
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, JPEG, PNG or WEBP — up to 5 MB per image, {MAX_STUDIO_IMAGES} images
          max. Stored securely on Cloudinary.
        </span>
      </div>

      {/* Option 2 — paste an external image URL (existing flow, kept) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="studio-image-url" className="pl-4">
          Or add an image URL
        </Label>
        <div className="flex gap-2">
          <input
            id="studio-image-url"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addImageUrl();
              }
            }}
            placeholder="https://images.unsplash.com/…"
            className={urlInputClasses}
            inputMode="url"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-2xl"
            onClick={addImageUrl}
            disabled={disabled || !urlDraft.trim()}
          >
            <Plus className="size-4" /> Add URL
          </Button>
        </div>
        <p className="pl-4 text-xs text-muted-foreground">
          Paste a direct link to a hosted photo of your space.
        </p>
      </div>

      {/* Uploads in flight */}
      {uploads.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {uploads.map((job) => (
            <li
              key={job.key}
              className="flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border bg-muted/50 p-3"
            >
              <Spinner className="size-5 text-primary" />
              <span className="w-full truncate text-center text-xs text-muted-foreground">
                {job.name}
              </span>
              <div
                role="progressbar"
                aria-valuenow={job.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Uploading ${job.name}`}
                className="h-1.5 w-full overflow-hidden rounded-full bg-background"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
            >
              <StudioImageFrame
                src={image.url}
                alt={`Studio image ${index + 1}`}
                sizes="(min-width: 1024px) 12rem, (min-width: 640px) 33vw, 50vw"
                compact
                label={false}
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#252A24]/80 px-2 py-0.5 text-[0.65rem] font-medium text-[#F7F5EF] backdrop-blur-sm">
                  <Star className="size-3" aria-hidden="true" /> Cover
                </span>
              )}
              {!disabled && (
                <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1 rounded-full bg-background/85 px-1.5 py-1 shadow-sm opacity-0 backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move image ${index + 1} earlier`}
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronLeft className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label={`Move image ${index + 1} later`}
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    disabled={index === 0}
                    aria-label={
                      index === 0
                        ? "This is the cover image"
                        : `Make image ${index + 1} the cover image`
                    }
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-30"
                  >
                    <Star className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        uploads.length === 0 && (
          <p className="flex items-center gap-2 pl-4 text-xs text-muted-foreground">
            <ImageOff className="size-3.5 shrink-0" aria-hidden="true" />
            No images yet — upload photos or add image URLs. The first image
            becomes the cover.
          </p>
        )
      )}
      <p className="flex items-center gap-2 pl-4 text-xs text-muted-foreground">
        <ImagePlus className="size-3.5 shrink-0" aria-hidden="true" />
        Reorder with the arrows; the star promotes an image to the cover photo.
      </p>
    </div>
  );
}
