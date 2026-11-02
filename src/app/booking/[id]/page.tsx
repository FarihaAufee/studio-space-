import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { BookingDetailView } from "@/components/bookings/booking-detail-view";

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Booking Details — StudioSpace",
  description: "Session details, price summary, and actions for one booking.",
};

/** Single-booking detail page. Validates the id shape before going further. */
export default async function BookingPage({ params }: BookingPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to my bookings
        </Link>

        <header className="mt-6 max-w-2xl">
          <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            Booking Details
          </h1>
          <p className="mt-3 text-muted-foreground">
            Everything about this reservation — the session, the pricing, and
            its current status.
          </p>
        </header>

        <section className="mt-8" aria-label="Booking information">
          <BookingDetailView bookingId={id} />
        </section>
      </div>
    </main>
  );
}
