import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { HostDashboardView } from "@/components/host/host-dashboard-view";

// Cache Components migration: this route reads the Better Auth session
// (request data) and must block on the server — see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Host Dashboard — StudioSpace",
  description:
    "Your studio listings, booking requests, and host insights in one place.",
};

/**
 * Host Dashboard — only authenticated hosts and admins can access.
 * Customers are redirected to the Become a Host onboarding; unauthenticated
 * visitors land on login and will return here afterwards.
 */
export default async function HostDashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?next=/host/dashboard");
  }

  // Authorization here mirrors the server API: admins pass via the env
  // list; hosts must be marked in the verified account data that comes
  // with the request cookie — the client can only ever *show* a role.
  const isHostOrAdmin =
    isAdminEmail(session.user.email) ||
    (session.user as { role?: string }).role === "host";

  if (!isHostOrAdmin) {
    redirect("/become-a-host");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Host workspace
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <LayoutDashboard className="size-8 text-primary" aria-hidden="true" />
            Host Dashboard
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your listings, booking requests, and activity — everything a
            StudioSpace host manages, in one calm place.
          </p>
        </header>

        <section className="mt-8" aria-label="Dashboard overview">
          <HostDashboardView />
        </section>
      </div>
    </main>
  );
}
