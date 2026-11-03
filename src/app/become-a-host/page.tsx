import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarCheck,
  Hammer,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { BecomeHostForm } from "@/components/host/become-host-form";
import { Button } from "@/components/ui/button";

// Cache Components migration: this route reads the Better Auth session
// (request data) and must block on the server — see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Become a Host — StudioSpace",
  description:
    "Turn your creative space into opportunity. List your studio, reach professionals, and manage bookings on StudioSpace.",
};

const BENEFITS = [
  {
    icon: Users,
    title: "Reach creative professionals",
    description:
      "Put your studio in front of photographers, filmmakers, podcasters and producers actively booking by the hour.",
  },
  {
    icon: Hammer,
    title: "Manage studio availability",
    description:
      "List, update, and retire spaces from a dashboard that always reflects what the public gallery shows.",
  },
  {
    icon: CalendarCheck,
    title: "Receive and manage booking requests",
    description:
      "Approve or decline requests for your spaces with one tap — every decision is recorded in the booking.",
  },
  {
    icon: TrendingUp,
    title: "Control listings and pricing",
    description:
      "Set hourly rates, deposits, and capacity per studio, and adjust them whenever your schedule changes.",
  },
];

export default async function BecomeAHostPage() {
  const session = await getServerSession();

  // Unauthenticated visitors are sent to login and returned here after.
  if (!session) {
    redirect("/login?next=/become-a-host");
  }

  // Admin-adjacent customers can still onboard; already-hosts go straight
  // to the dashboard. Admins keep admin access without needing onboarding.
  const alreadyHost =
    isAdminEmail(session.user.email) ||
    (session.user as { role?: string }).role === "host";

  if (alreadyHost) {
    redirect("/host/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        {/* Hero */}
        <header className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Become a host
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Turn Your Creative Space Into Opportunity
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Own a photo studio, film stage, podcast room, music suite, or art
            space? List it on StudioSpace and earn by the hour while we bring
            creative professionals to your door. Your studio can be live on
            the public gallery minutes after a validated application.
          </p>
        </header>

        {/* Benefits */}
        <section
          className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Host benefits"
        >
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)]"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-heading text-lg leading-snug tracking-tight">
                  {benefit.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </section>

        {/* Onboarding form */}
        <section className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" aria-label="Host onboarding">
          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
            <div className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2.5 font-heading text-2xl tracking-tight sm:text-3xl">
                <Sparkles className="size-6 text-primary" aria-hidden="true" />
                Host onboarding
              </h2>
              <p className="text-sm text-muted-foreground">
                Complete the details below — validated applications approve
                instantly and unlock the Host Dashboard.
              </p>
            </div>
            <BecomeHostForm
              fallbackName={session.user.name ?? ""}
              email={session.user.email}
            />
          </div>

          <aside className="flex flex-col gap-5 rounded-3xl border border-border bg-muted/50 p-6" aria-label="What happens next">
            <h3 className="font-heading text-xl tracking-tight">
              What happens next
            </h3>
            <ol className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Your details are verified against your StudioSpace account —
                email comes from the signed-in session, so it is always
                trustworthy.
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Valid applications are approved instantly and your account
                gains host permissions.
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                The navigation menus update to the host tools: dashboard,
                listings, and the booking inbox.
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Publish your first studio — it appears in the public gallery
                immediately.
              </li>
            </ol>
            <p className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
              Remaining a customer elsewhere? Hosts keep every customer
              capability — you can still book other studios for your own
              sessions.
            </p>
          </aside>
        </section>

        {/* Final CTA anchor */}
        <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button size="lg" render={<a href="#host-application" />}>
            <Sparkles className="size-4" aria-hidden="true" />
            Become a Host
          </Button>
          <p className="text-xs text-muted-foreground">
            Takes under two minutes — all fields are validated before submit.
          </p>
        </div>
        <span id="host-application" className="sr-only">
          Host application form
        </span>
      </div>
    </main>
  );
}
