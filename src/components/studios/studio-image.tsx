"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

/**
 * Studio image with a guaranteed StudioSpace-themed fallback.
 *
 * Every place that displays a studio image renders this inside a
 * `relative overflow-hidden` container (the aspect-ratio wrapper). It three
 * cases cleanly:
 *
 *   1. No image at all — the studio has no cover (empty/whitespace/invalid
 *      `src`). `next/image` hard-errors on an empty `src` and would crash the
 *      whole page, so the placeholder is rendered without ever mounting the
 *      <img>. (Legacy `image`-only documents normalize to `""` via
 *      `studioPrimaryImage` when they lack an image.)
 *   2. Broken image — the URL resolves but the host returns 404/error or
 *      non-image content (e.g. dead Unsplash photo IDs). `onError` swaps just
 *      this one image for the placeholder; the rest of the page and gallery
 *      stay intact.
 *   3. Working image — plain `fill` + `object-cover` next/image render.
 *
 * `unoptimized` is kept consistent with the rest of the app (external hosts
 * are hot-linked directly; see next.config.ts remotePatterns for the same
 * host list in case optimization is ever enabled).
 */

interface StudioImageProps {
  /** Image URL; empty/whitespace/invalid renders the placeholder instantly. */
  src: string | null | undefined;
  /** Alt text describing the space (the studio title). */
  alt: string;
  /** next/image `sizes` hint — forward the value used by the layout slot. */
  sizes?: string;
  /** Marks the image as a page-level LCP candidate. */
  priority?: boolean;
  /** Loads eagerly for above-the-fold cards (first grid row). */
  eager?: boolean;
  /**
   * Extra classes for the <img> itself (e.g. the card's hover-zoom
   * transition). `object-cover` is always applied.
   */
  className?: string;
  /** Placeholder label; set false to show the icon only. */
  label?: string | false;
  /** Compact placeholders (small booking thumbs) omit the label by default. */
  compact?: boolean;
}

export function StudioImage({
  src,
  alt,
  sizes,
  priority,
  eager,
  className = "",
  label,
  compact,
}: StudioImageProps) {
  // Whitespace-only or invalid-shaped URLs are equivalent to "no image".
  const usable = typeof src === "string" && /^https?:\/\/\S+$/i.test(src.trim());
  const [failed, setFailed] = useState(false);
  // `false` suppresses the caption; `compact` placeholders stay icon-only.
  const labelText = label === false ? null : label ?? "Photo coming soon";

  if (!usable || failed) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F5F1E8] via-[#EFE9DD] to-[#E4DCCE]"
        role="img"
        aria-label={`${alt} — photo unavailable`}
      >
        <span
          className={
            compact
              ? "flex size-7 items-center justify-center rounded-full border border-[#252A24]/15 bg-[#F7F5EF]/80"
              : "flex size-11 items-center justify-center rounded-full border border-[#252A24]/15 bg-[#F7F5EF]/80 shadow-sm"
          }
        >
          {/* Lucide is tree-shaken at build — icon-only import stays light. */}
          <Camera
            className={compact ? "size-3.5" : "size-5"}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ color: "#6B6F67" }}
          />
        </span>
        {labelText && !compact ? (
          <span className="px-4 text-center text-xs font-medium text-[#6B6F67]">
            {labelText}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={eager && !priority ? "eager" : undefined}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      unoptimized
    />
  );
}
