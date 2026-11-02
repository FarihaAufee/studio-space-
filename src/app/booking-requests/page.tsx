import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { BookingRequestsView } from "@/components/bookings/booking-requests-view";

export const metadata: Metadata = {
  title: "Booking Requests — StudioSpace",
  description:
    "Review, approve, and reject booking requests for the studios you host.",
};

/**
 * Host dashboard for incoming booking requests. Gated by the Better Auth
 * session; the view is wired to the backend's (future) host-side endpoints.
 */
export default async function BookingRequestsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Host inbox
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <BadgeCheck className="size-8 text-primary" aria-hidden="true" />
            Booking Requests
          </h1>
          <p className="mt-3 text-muted-foreground">
            Requests arrive from your booking calendar — approve a request to
            confirm the session, or reject it to release the slot.
          </p>
        </header>

        <section className="mt-8" aria-label="Incoming booking requests">
          <BookingRequestsView />
        </section>
      </div>
    </main>
  );
}
