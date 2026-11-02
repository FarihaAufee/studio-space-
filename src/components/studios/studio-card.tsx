import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import type { Studio } from "@/app/studios/studios";

/**
 * Responsive studio card used by the studios gallery, category pages and
 * dashboards. Links to the studio details page; the whole card is one link
 * so keyboard and touch interactions behave like a native one.
 */
export function StudioCard({ studio, eager }: { studio: Studio; eager?: boolean }) {
  const capacity = studio.maxCapacity;

  return (
    <Link
      href={`/studios/${studio._id}`}
      className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_24px_rgba(37,42,36,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(37,42,36,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      aria-label={`View ${studio.title}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={studio.image}
          alt={studio.title}
          fill
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
          loading={eager ? "eager" : undefined}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized
        />
        {/* Category chip over a dark scrim remains readable on any photo. */}
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-[#252A24]/70 px-3 py-1 text-xs font-medium text-[#F7F5EF] backdrop-blur-sm">
          {studio.category}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-xl leading-snug tracking-tight">
            {studio.title}
          </h2>
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {studio.location}
        </p>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/70">
          <p className="text-sm font-semibold text-foreground">
            ৳{studio.hourlyRate}
            <span className="font-normal text-muted-foreground"> / hour</span>
          </p>
          {capacity ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              Up to {capacity} guests
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Grid wrapper that keeps gallery spacing consistent across pages.
 * The first row is loaded eagerly — those images are typically the LCP. */
export function StudioGrid({ studios }: { studios: Studio[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {studios.map((studio, index) => (
        <StudioCard key={studio._id} studio={studio} eager={index < 3} />
      ))}
    </div>
  );
}
