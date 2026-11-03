import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Info } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { StudioForm } from "@/components/studios/studio-form";

// Cache Components migration: this route reads the Better Auth session
// (request data) and must block on the server — see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Add New Studio — StudioSpace",
  description: "List your creative studio on StudioSpace and reach creators near you.",
};

/**
 * Studio creation form. The Better Auth server session gates the route, and
 * the signed-in account supplies the ownership fields the backend stamps
 * onto the document (hostName / hostEmail prefill + server-side hostId).
 */
export default async function AddStudioPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Only hosts (and admins) can publish studios; customers are pointed at
  // the Become a Host onboarding first.
  const isHostOrAdmin =
    isAdminEmail(session.user.email) ||
    (session.user as { role?: string }).role === "host";
  if (!isHostOrAdmin) redirect("/become-a-host");

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            For hosts
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <Camera className="size-8 text-primary" aria-hidden="true" />
            Add New Studio
          </h1>
          <p className="mt-3 text-muted-foreground">
            Describe your space, set pricing, and publish — listings appear in
            the public gallery immediately.
          </p>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* The form card */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
            <StudioForm
              mode="create"
              hostName={session.user.name ?? ""}
              hostEmail={session.user.email ?? ""}
            />
          </section>

          {/* Sidebar guidance */}
          <aside className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/50 p-6" aria-label="Listing tips">
            <h2 className="font-heading text-xl tracking-tight">Listing tips</h2>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Use a wide, well-lit photo — the cover image is what creators
                see first in the gallery.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Mention natural light, power, and noise levels in the overview.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                List only amenities that are genuinely available on site.
              </li>
            </ul>
            <p className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
              By publishing you agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                term of service
              </Link>{" "}
              for hosts.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
