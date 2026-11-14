import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { AdminStudiosView } from "@/components/admin/admin-studios-view";
import { AdminAccessDenied } from "@/components/admin/access-denied";

export const metadata: Metadata = {
  title: "Admin · Studios — StudioSpace",
  description: "Manage every StudioSpace studio, including legacy and demo listings.",
};

/** Admin studio management list. Same auth/ authorization gate as /admin. */
export default async function AdminStudiosPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/admin/studios");

  if (!isAdminEmail(session.user.email)) {
    return <AdminAccessDenied />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Admin dashboard
          </Link>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <Building2 className="size-8 text-primary" aria-hidden="true" />
            Studio Management
          </h1>
          <p className="mt-3 text-muted-foreground">
            Every studio on StudioSpace — host-owned, demo, and legacy listings —
            searchable and manageable in one place.
          </p>
        </header>

        <section className="mt-8 flex flex-col gap-6" aria-label="All studios">
          <AdminStudiosView />
        </section>
      </div>
    </main>
  );
}
