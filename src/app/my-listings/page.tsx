import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Images } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { MyListingsView } from "@/components/bookings/my-listings-view";

export const metadata: Metadata = {
  title: "My Listings — StudioSpace",
  description: "Manage the studios you have listed on StudioSpace.",
};

/** Host dashboard for editing and deleting owned studio listings. */
export default async function MyListingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Host dashboard
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <Images className="size-8 text-primary" aria-hidden="true" />
            My Listings
          </h1>
          <p className="mt-3 text-muted-foreground">
            Update pricing, present your spaces well, and retire listings you
            no longer host.
          </p>
        </header>

        <section className="mt-8" aria-label="Your studio listings">
          <MyListingsView />
        </section>
      </div>
    </main>
  );
}
