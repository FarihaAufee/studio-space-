import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ImageOff, Pencil } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { findStudioById } from "@/lib/db";
import { StudioForm } from "@/components/studios/studio-form";
import { AdminAccessDenied } from "@/components/admin/access-denied";
import { Button } from "@/components/ui/button";

interface AdminStudioEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminStudioEditPageProps): Promise<Metadata> {
  const { id } = await params;
  const studio = await findStudioById(id);
  return {
    title: studio
      ? `Admin · Edit ${studio.title} — StudioSpace`
      : "Admin · Studio not found — StudioSpace",
  };
}

/**
 * Admin edit form for ANY studio (admin path resolves both real ObjectIds
 * and legacy string _id values server-side). Form submits to
 * PUT /api/admin/studios/:id, which enforces session + ADMIN_EMAILS again.
 * hostId is never editable from here — ownership identity is server-managed.
 */
export default async function AdminStudioEditPage({
  params,
}: AdminStudioEditPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!isAdminEmail(session.user.email)) {
    return <AdminAccessDenied />;
  }

  const { id } = await params;
  // Server components read the database directly (same data the public
  // GET /api/studios/:id route serves).
  const studio = await findStudioById(id);

  if (!studio) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ImageOff className="size-5" aria-hidden="true" />
            </span>
            <p className="font-heading text-2xl tracking-tight">
              Studio not found
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              It may have been deleted already, or the link is outdated.
            </p>
            <Button variant="outline" render={<Link href="/admin/studios" />}>
              Back to studio list
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-page py-10 md:py-14">
        <header className="max-w-2xl">
          <Link
            href="/admin/studios"
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Studio list
          </Link>
          <h1 className="mt-3 flex items-center gap-3 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
            <Pencil className="size-8 text-primary" aria-hidden="true" />
            Edit Studio
          </h1>
          <p className="mt-3 text-muted-foreground">
            {studio.title} — administrators can correct any listing,
            including demo and legacy studios without a host account.
          </p>
        </header>

        <section className="mt-8" aria-label="Edit studio form">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
            <p className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Building2 className="size-3.5" aria-hidden="true" />
              Studio ID {studio._id}
            </p>
            <StudioForm
              mode="edit"
              admin
              studioId={studio._id}
              initial={{
                title: studio.title,
                category: studio.category,
                location: studio.location,
                address: studio.address,
                // Legacy documents may store the description under
                // `description` instead of `overview`.
                overview: studio.overview ?? studio.description ?? "",
                image: studio.image,
                images: studio.images,
                hourlyRate: studio.hourlyRate,
                securityDeposit: studio.securityDeposit,
                maxCapacity: studio.maxCapacity,
                amenities: studio.amenities,
                hostName: studio.hostName,
                hostEmail: studio.hostEmail,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
