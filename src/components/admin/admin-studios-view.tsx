"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Ban,
  CalendarClock,
  CircleAlert,
  Images,
  MapPin,
  Pencil,
  RotateCw,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Studio } from "@/app/studios/studios";
import { CATEGORIES } from "@/data/categories";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Admin studio management list. Loads EVERY studio from
 * GET /api/admin/studios (requireAuth + requireAdmin), including demo and
 * legacy documents — legacy ids are 24-char hex strings and are handled by
 * the backend's dual id matching; the frontend only carries them opaquely.
 * Search matches studio name and location; category filter covers the known
 * categories plus any additional stored value.
 */

const inputClasses =
  "h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-50 [color-scheme:light]";

export function AdminStudiosView() {
  const [studios, setStudios] = useState<Studio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Delete confirmation state
  const [deleting, setDeleting] = useState<Studio | null>(null);
  const [deletionInProgress, setDeletionInProgress] = useState(false);

  const retry = () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    setReloadKey((key) => key + 1);
  };

  // Mount-time load (re-run after retries): async IIFE + race guard, so no
  // setState runs synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/studios`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setStudios((result.data as Studio[]) ?? []);
        } else {
          setError(result.message);
          setUnauthorized(response.status === 401 || response.status === 403);
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
  }, [reloadKey]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletionInProgress(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/studios/${deleting._id}`,
        { method: "DELETE", credentials: "include" }
      );
      const result = await parseApiResponse(response);

      if (response.ok) {
        toast.success("Studio deleted.");
        setStudios((current) =>
          current
            ? current.filter((item) => item._id !== deleting._id)
            : current
        );
        setDeleting(null);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeletionInProgress(false);
    }
  };

  // Known categories first, then any additional category stored in the DB.
  const categoryOptions = useMemo(() => {
    const stored = new Set<string>();
    studios?.forEach((studio) => {
      if (studio.category) stored.add(studio.category);
    });
    return [...CATEGORIES.map((item) => item.title), ...stored].filter(
      (value, index, all) =>
        all.findIndex((other) => other.toLowerCase() === value.toLowerCase()) ===
        index
    );
  }, [studios]);

  // Search hits studio name AND location (case-insensitive "contains").
  const visibleStudios = useMemo(() => {
    if (!studios) return null;
    const query = search.trim().toLowerCase();
    return studios.filter((studio) => {
      const matchesSearch =
        !query ||
        studio.title?.toLowerCase().includes(query) ||
        studio.location?.toLowerCase().includes(query);
      const matchesCategory =
        !category ||
        studio.category?.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [studios, search, category]);

  const filteredCount =
    studios !== null && (search.trim() || category)
      ? visibleStudios?.length ?? 0
      : null;

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

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          {unauthorized ? "Admin access required" : "Studios could not be loaded"}
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {unauthorized
            ? "Your admin access could not be verified. Please sign in with an admin account and try again."
            : error}
        </p>
        <Button variant="outline" onClick={retry}>
          <RotateCw className="size-4" /> Try again
        </Button>
      </div>
    );
  }

  if (!visibleStudios || visibleStudios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Images className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          {studios?.length ? "No studios match these filters" : "No studios yet"}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {studios?.length
            ? "Try a different search term, location or category."
            : "Studios appear here as soon as hosts publish them."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter bar: search by name + location, filter by category */}
      <div className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-[0_2px_24px_rgba(37,42,36,0.05)] md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="admin-search"
            className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase"
          >
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="admin-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Studio name or location…"
              className={`${inputClasses} pl-10`}
              aria-label="Search studios by name and location"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="admin-category"
            className="pl-1 text-xs font-medium tracking-wider text-muted-foreground uppercase"
          >
            Category
          </label>
          <select
            id="admin-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`${inputClasses} appearance-none pr-4`}
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-2xl"
          disabled={!search && !category}
          onClick={() => {
            setSearch("");
            setCategory("");
          }}
        >
          <RotateCw className="size-4" /> Clear filters
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {(filteredCount ?? studios?.length ?? 0)}{" "}
        {(filteredCount ?? studios?.length ?? 0) === 1 ? "studio" : "studios"}{" "}
        in the database
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStudios.map((studio) => (
          <article
            key={studio._id}
            className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_24px_rgba(37,42,36,0.05)]"
          >
            <Link
              href={`/studios/${studio._id}`}
              className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
              aria-label={`View ${studio.title} public page`}
            >
              <Image
                src={studio.image}
                alt={studio.title}
                fill
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </Link>

            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-heading text-lg leading-snug tracking-tight">
                  {studio.title}
                </h2>
                <Badge variant="secondary" className="shrink-0">
                  {studio.category}
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {studio.location}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                {studio.hostName ? (
                  <span className="min-w-0 truncate">
                    {studio.hostName}
                    {studio.hostEmail ? ` · ${studio.hostEmail}` : ""}
                  </span>
                ) : (
                  "No host recorded (legacy / demo)"
                )}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span>
                  ৳{studio.hourlyRate?.toLocaleString("en-US") ?? "—"}/hour
                </span>
                {studio.maxCapacity ? (
                  <span>Up to {studio.maxCapacity} guests</span>
                ) : null}
                {studio.createdAt ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    {new Date(studio.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
                {!studio.hostId ? (
                  <Badge variant="outline" className="ml-auto shrink-0">
                    Legacy / demo
                  </Badge>
                ) : null}
              </div>

              {/* Admin row actions */}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  render={<Link href={`/admin/studios/${studio._id}/edit`} />}
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

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl tracking-tight">
              Delete this studio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.title} will be permanently removed from the database,
              including its public listing. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletionInProgress}>
              Keep studio
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={deletionInProgress}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deletionInProgress ? "Deleting…" : "Delete studio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
