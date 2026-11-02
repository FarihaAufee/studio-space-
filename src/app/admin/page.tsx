import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { AdminAccessDenied } from "@/components/admin/access-denied";

export const metadata: Metadata = {
  title: "Admin Dashboard — StudioSpace",
  description: "StudioSpace administration: studio, user, and booking totals.",
};

/**
 * Admin dashboard. Gated in order: unauthenticated visitors are redirected
 * to /login (the backend returns 401 for the same case), authenticated users
 * whose email is not in the server-side ADMIN_EMAILS env list get the 403
 * access-denied screen. The admin list itself never reaches the client bundle.
 */
export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!isAdminEmail(session.user.email)) {
    return <AdminAccessDenied />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Admin area
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
            Admin Dashboard
          </h1>
          <p className="mt-3 text-muted-foreground">
            Live totals straight from the StudioSpace database, and quick access
            to every management screen.
          </p>
        </header>

        <section className="mt-8" aria-label="Admin statistics">
          <AdminDashboardView />
        </section>
      </div>
    </main>
  );
}
