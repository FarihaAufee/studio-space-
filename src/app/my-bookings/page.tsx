import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { MyBookingsView } from "@/components/bookings/my-bookings-view";

// Cache Components migration: this route reads the Better Auth session
// (request data) and must block on the server — see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "My Bookings — StudioSpace",
  description: "Review your booking history and upcoming studio sessions.",
};

/** Booking history with client-side status filtering, gated by the session. */
export default async function MyBookingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/my-bookings");

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            For creators
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <CalendarCheck className="size-8 text-primary" aria-hidden="true" />
            My Bookings
          </h1>
          <p className="mt-3 text-muted-foreground">
            Track upcoming sessions, confirmations, and your full booking
            history.
          </p>
        </header>

        <section className="mt-8" aria-label="Your bookings">
          <MyBookingsView />
        </section>
      </div>
    </main>
  );
}
