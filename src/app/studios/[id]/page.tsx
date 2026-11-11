import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookingCard } from "@/components/studios/booking-card";
import { findStudioById } from "@/lib/db";
import { getStudioImages } from "@/lib/studio-images";
import { StudioImage } from "@/components/studios/studio-image";
import type { Studio } from "@/app/studios/studios";

// Cache Components migration: this route resolves studio details from the
// live database per request (dynamic id), so it must block on the server —
// see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

// Cached per request so the page and its metadata share one DB read.
const getStudio = cache(async (id: string): Promise<Studio | null> => {
  try {
    return await findStudioById(id);
  } catch (error) {
    console.error(error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const studio = await getStudio(id);
  if (!studio) {
    return { title: "Studio not found — StudioSpace" };
  }
  return {
    title: `${studio.title} — StudioSpace`,
    description: studio.overview
      ? `Book ${studio.title} in ${studio.location}. ${studio.overview}`.slice(0, 160)
      : `Book ${studio.title} in ${studio.location} on StudioSpace.`,
  };
}

// Initials derived from the real host name (same convention as Login/Register cards).
const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export default async function StudioDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getStudio(id);

  if (!studio) notFound();

  // Ordered gallery — index 0 is the cover; legacy `image`-only documents
  // normalize to a single-entry list so every studio renders the same way.
  const gallery = getStudioImages(studio);

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page pb-16 pt-4 md:pb-24 md:pt-6">
        <Link
          href="/studios"
          className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to studios
        </Link>

        {/* Image gallery */}
        <figure className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-[0_14px_48px_rgba(37,42,36,0.10)] sm:aspect-[2/1] lg:aspect-[21/9]">
          <StudioImage
            src={gallery[0]?.url}
            alt={studio.title}
            priority
            sizes="(min-width: 1280px) 80rem, 100vw"
            label="No cover photo yet"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4 sm:p-6">
            <Badge
              variant="secondary"
              className="bg-card/90 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm"
            >
              <Sparkles className="text-primary" aria-hidden="true" />
              {studio.category}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-card/90 text-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm"
            >
              <MapPin className="text-primary" aria-hidden="true" />
              {studio.location}
            </Badge>
          </figcaption>
        </figure>

        {/* Thumbnail strip — only for studios with more than one image. */}
        {gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {gallery.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                {/* Each thumbnail fails independently — one dead URL can't
                    take down the strip. */}
                <StudioImage
                  src={image.url}
                  alt={`${studio.title} photo ${index + 1}`}
                  sizes="(min-width: 1024px) 10rem, 20vw"
                  compact
                  label={false}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          {/* Studio information */}
          <section className="min-w-0">
            <header>
              <h1 className="font-heading text-4xl leading-[1.08] tracking-tight sm:text-5xl">
                {studio.title}
              </h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {studio.address || studio.location}
              </p>
            </header>

            <div className="mt-8">
              <h2 className="font-heading text-2xl tracking-tight">About this studio</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{studio.overview}</p>
            </div>

            {/* Amenities */}
            <div className="mt-10">
              <h2 className="font-heading text-2xl tracking-tight">Amenities</h2>
              {studio.amenities?.length ? (
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {studio.amenities.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-sm text-foreground"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary"
                      >
                        <Check className="size-4" />
                      </span>
                      <span className="min-w-0 truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Amenity details are available on request from the host.
                </p>
              )}
            </div>

            {/* Host details */}
            <div className="mt-10">
              <h2 className="font-heading text-2xl tracking-tight">Meet your host</h2>
              <Card className="mt-4 gap-0 rounded-3xl border-border/70 py-5 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
                <CardContent className="flex items-center gap-4">
                  <Avatar className="size-14 shrink-0">
                    <AvatarFallback className="bg-primary font-heading text-xl font-medium text-primary-foreground">
                      {getInitials(studio.hostName ?? "") || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-heading text-lg leading-tight">
                      Hosted by {studio.hostName ?? "a StudioSpace host"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {studio.category} host in {studio.location}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Booking card */}
          <aside className="min-w-0" aria-label="Booking options">
            <BookingCard
              studioId={studio._id}
              studioTitle={studio.title}
              hourlyRate={studio.hourlyRate}
              securityDeposit={studio.securityDeposit}
              maxCapacity={studio.maxCapacity}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
