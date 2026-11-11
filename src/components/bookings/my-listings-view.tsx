"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  CalendarClock,
  CircleAlert,
  Images,
  Pencil,
  Plus,
  ServerOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudioForm } from "@/components/studios/studio-form";
import { StudioImage } from "@/components/studios/studio-image";
import type { Studio } from "@/app/studios/studios";
import { studioPrimaryImage } from "@/lib/studio-images";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

/**
 * Host dashboard listing the studios signed in from the Better Auth session.
 * Data comes from GET /api/hosts/listings with browser credentials; 403
 * keeps the Become a Host onboarding visible, 401/5xx surface retryable
 * error states.
 */
export function MyListingsView() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [listings, setListings] = useState<Studio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit dialog + delete confirmation state.
  const [editing, setEditing] = useState<Studio | null>(null);
  const [deleting, setDeleting] = useState<Studio | null>(null);
  const [deletionInProgress, setDeletionInProgress] = useState(false);

  // Shared loader for the retry action (event handlers may set state freely).
  const loadListings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hosts/listings`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await parseApiResponse(response);

      if (response.ok) {
        setForbidden(false);
        setError(null);
        setListings((result.data as Studio[]) ?? []);
      } else {
        setForbidden(response.status === 403);
        setError(result.message);
      }
    } catch {
      setError("We could not reach the StudioSpace API. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount-time load: an async IIFE with a race guard so no setState runs
  // synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/hosts/listings`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setForbidden(false);
          setError(null);
          setListings((result.data as Studio[]) ?? []);
        } else {
          setForbidden(response.status === 403);
          setError(result.message);
        }
      } catch {
        if (cancelled) return;
        setError("We could not reach the StudioSpace API. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletionInProgress(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/hosts/listings/${deleting._id}`,
        { method: "DELETE", credentials: "include" }
      );
      const result = await parseApiResponse(response);

      if (response.ok) {
        toast.success("Listing deleted.");
        setListings((current) =>
          current ? current.filter((item) => item._id !== deleting._id) : current
        );
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeletionInProgress(false);
    }
  };

  /* Loading skeletons */
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  /* Error state — 403 keeps the onboarding path visible. */
  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Host access required
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Your listings are managed here once host access is active. Complete
          the Become a Host onboarding to publish studios.
        </p>
        <Button render={<Link href="/become-a-host" />}>Become a Host</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ServerOff className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Listings could not be loaded
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            setError(null);
            void loadListings();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  /* Empty state */
  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Images className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">No listings yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Publish your first studio and it will appear in the public gallery
          right away.
        </p>
        <Button render={<Link href="/add-studio" />}>
          <Plus className="size-4" /> Add your first studio
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header row with count + primary action */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}
        </p>
        <Button render={<Link href="/add-studio" />}>
          <Plus className="size-4" /> Add new studio
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((studio) => (
          <article
            key={studio._id}
            className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_24px_rgba(37,42,36,0.05)]"
          >
            <Link
              href={`/studios/${studio._id}`}
              className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
              aria-label={`View ${studio.title} public page`}
            >
              {/* Empty cover used to pass "" into next/image and crash the
                  whole listing page; StudioImage renders the placeholder. */}
              <StudioImage
                src={studioPrimaryImage(studio)}
                alt={studio.title}
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
              />
            </Link>

            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-heading text-lg leading-snug tracking-tight">
                  {studio.title}
                </h2>
                <Badge variant="secondary" className="shrink-0">
                  {studio.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{studio.location}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  Added{" "}
                  {studio.createdAt
                    ? new Date(studio.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "recently"}
                </span>
                {studio.maxCapacity ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden="true" />
                    Up to {studio.maxCapacity}
                  </span>
                ) : null}
              </div>

              {/* Row actions */}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditing(studio)}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleting(studio)}
                >
                  <Ban className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Edit dialog reuses the shared studio form in edit mode */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-tight">
              Edit listing
            </DialogTitle>
            <DialogDescription>
              Update the details of {editing?.title}. Ownership cannot be
              transferred.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <StudioForm
              mode="edit"
              studioId={editing._id}
              initial={{
                title: editing.title,
                category: editing.category,
                location: editing.location,
                address: editing.address,
                image: editing.image,
                images: editing.images,
                overview: editing.overview,
                hourlyRate: editing.hourlyRate,
                securityDeposit: editing.securityDeposit,
                maxCapacity: editing.maxCapacity,
                amenities: editing.amenities,
              }}
              hostName={session?.user?.name ?? undefined}
              hostEmail={session?.user?.email ?? undefined}
              onSaved={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl tracking-tight">
              Delete this listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.title} will be removed from the public gallery. Existing
              bookings keep their snapshots, but no new bookings can be made.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletionInProgress}>
              Keep listing
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={deletionInProgress}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deletionInProgress ? "Deleting…" : "Delete listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
