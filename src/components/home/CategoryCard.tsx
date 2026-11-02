"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/data/categories";

interface CategoryCardProps {
  category: Category;
  /** Placement/spacing classes provided by the section grid. */
  className?: string;
}

/**
 * Reusable category card: landscape image, charcoal veil for readable copy,
 * hover zoom, and a graceful beige fallback if the image fails to load.
 */
export function CategoryCard({ category, className }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/studios?category=${category.slug}`}
      aria-label={`Browse ${category.title.toLowerCase()} studios`}
      className={cn(
        "group relative block aspect-[4/3] overflow-hidden rounded-[18px] border border-border shadow-[0_2px_12px_rgba(37,42,36,0.06)] transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(37,42,36,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className
      )}
    >
      {imageError ? (
        // Graceful fallback when the category image is missing.
        <span
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground"
        >
          <ImageOff className="size-6" strokeWidth={1.5} />
          <span className="text-xs">Image unavailable</span>
        </span>
      ) : (
        <>
          <Image
            src={category.image}
            alt={category.alt}
            fill
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          {/* Charcoal scrim layered under a bottom gradient so the copy always
              keeps contrast, even over very bright photos like cyc walls.
              Uses the literal brand charcoal (not the theme-swapping
              --charcoal token, which becomes cream in dark mode). */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[#252A24]/20 bg-gradient-to-t from-[#252A24]/95 via-[#252A24]/60 to-[#252A24]/10 transition-[background-color] duration-300 group-hover:bg-[#252A24]/25 group-focus-visible:bg-[#252A24]/25 group-active:bg-[#252A24]/30"
          />
        </>
      )}

      {/* Arrow chip */}
      <span
        className={cn(
          "absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300",
          imageError
            ? "border-border bg-transparent text-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
            : "border-white/40 bg-white/10 text-white group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
        )}
      >
        <ArrowUpRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </span>

      {/* Copy */}
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 sm:p-6">
        <span
          className={cn(
            "font-heading text-2xl leading-tight sm:text-[1.75rem]",
            imageError ? "text-foreground" : "text-white"
          )}
        >
          {category.title}
        </span>
        <span
          className={cn(
            "max-w-[26rem] text-sm leading-relaxed sm:text-[0.95rem]",
            imageError ? "text-muted-foreground" : "text-white/90"
          )}
        >
          {category.description}
        </span>
      </span>
    </Link>
  );
}
