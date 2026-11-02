import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRoundPen } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

// Cache Components migration: this route reads the Better Auth session
// (request data) and must block on the server — see nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Edit Profile — StudioSpace",
  description: "Update your StudioSpace profile photo, name, and details.",
};

/**
 * Dedicated profile editing route. The Better Auth server session gates the
 * page and supplies the current values; the client form saves through
 * `authClient.updateUser()` (including the additional `phone`/`bio` fields).
 */
export default async function ProfileEditPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const user = session.user;

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to profile
        </Link>

        <header className="mt-6 max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Your account
          </p>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <UserRoundPen className="size-8 text-primary" aria-hidden="true" />
            Edit Profile
          </h1>
          <p className="mt-3 text-muted-foreground">
            Keep your details current — hosts and booking confirmations use
            this information to reach you.
          </p>
        </header>

        <section className="mt-8 max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
          <ProfileEditForm
            initial={{
              name: user.name ?? "",
              email: user.email ?? "",
              phone: user.phone ?? "",
              bio: user.bio ?? "",
              image: user.image && user.image.trim().length > 0 ? user.image : null,
            }}
          />
        </section>
      </div>
    </main>
  );
}
