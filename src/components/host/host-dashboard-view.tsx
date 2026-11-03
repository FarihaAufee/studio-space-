"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  Check,
  CircleAlert,
  Clock,
  Hourglass,
  Images,
  Inbox,
  ListPlus,
  MapPin,
  Plus,
  RotateCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/studios/status-badge";
import type { BookingRecord } from "@/types/booking";
import { formatBookingDate } from "@/types/booking";
import type { HostProfile } from "@/types/host";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Host Dashboard body. All numbers stream from GET /api/hosts/me with
 * browser credentials — live MongoDB counts and records, never fabricated
 * locally. 403 keeps a Become a Host CTA visible (role mismatch), while
 * 401/500 surface retryable error states.
 */

const STAT_CARDS = [
  {
    key: "totalListings" as const,
    label: "Total studio listings",
    icon: Images,
    description: "Every studio you listed on StudioSpace.",
  },
  {
    key: "activeListings" as const,
    label: "Active studio listings",
    icon: ListPlus,
    description: "Listings currently visible in the public gallery.",
  },
  {
    key: "totalRequests" as const,
    label: "Total booking requests",
    icon: Inbox,
    description: "All requests for your studios, any status.",
  },
  {
    key: "pendingRequests" as const,
    label: "Pending booking requests",
    icon: Hourglass,
    description: "Requests waiting for your approve or reject decision.",
  },
];

export function HostDashboardView() {
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Mount-time load (re-run after retries): async IIFE + race guard so no
  // setState runs synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/hosts/me`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setForbidden(false);
          setError(null);
          setProfile((result.data as HostProfile) ?? null);
        } else {
          setError(result.message);
          setForbidden(response.status === 403);
        }
      } catch {
        if (!cancelled) {
          setError("We could not reach the StudioSpace API. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-12 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Host access could not be verified
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Your account does not have host permissions in the current session.
          If you just activated, refresh the page — otherwise complete the
          Become a Host onboarding.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/become-a-host" />}>
            Become a Host
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setError(null);
              setForbidden(false);
              setReloadKey((key) => key + 1);
            }}
          >
            <RotateCw className="size-4" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Dashboard could not be loaded
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            setError(null);
            setReloadKey((key) => key + 1);
          }}
        >
          <RotateCw className="size-4" /> Try again
        </Button>
      </div>
    );
  }

  const displayName = profile.user.name.trim() || profile.user.email;
  const firstName = displayName.split(" ")[0] ?? displayName;
  const recentRequests = profile.recentRequests ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome + host identity */}
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Host account · {profile.user.email}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Check className="size-3.5 text-primary" aria-hidden="true" />
            Active host
          </Badge>
        </div>

        <dl className="grid gap-x-8 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Business name
            </dt>
            <dd className="min-w-0 truncate text-[0.9375rem] text-foreground">
              {profile.businessName || "Not provided yet"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Studio location
            </dt>
            <dd className="flex items-center gap-1.5 text-[0.9375rem] text-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {profile.location || "Not provided yet"}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Hosting type
            </dt>
            <dd className="text-[0.9375rem] capitalize text-foreground">
              {profile.hostingType ?? "Not provided yet"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Stat cards */}
      <section aria-label="Host statistics">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const value = profile.stats[card.key];
            const Icon = card.icon;
            return (
              <article
                key={card.key}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)]"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {card.label}
                </p>
                <p className="font-heading text-3xl leading-none tracking-tight">
                  {value.toLocaleString("en-US")}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <div className="grid gap-4 sm:grid-cols-3">
          <Button size="lg" className="justify-start" render={<Link href="/add-studio" />}>
            <Plus className="size-4" aria-hidden="true" />
            Add a new studio
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="justify-start"
            render={<Link href="/my-listings" />}
          >
            <Images className="size-4" aria-hidden="true" />
            Manage listings
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="justify-start"
            render={<Link href="/booking-requests" />}
          >
            <Inbox className="size-4" aria-hidden="true" />
            Manage booking requests
          </Button>
        </div>
      </section>

      {/* Recent booking activity */}
      <section
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8"
        aria-label="Recent booking activity"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-xl tracking-tight">
            Recent booking activity
          </h3>
          <Button variant="ghost" size="sm" render={<Link href="/booking-requests" />}>
            Open the full inbox
          </Button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              No booking requests yet. When guests request your studios, the
              latest activity shows here and in your inbox.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentRequests.map((request: BookingRecord) => (
              <li
                key={request._id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted sm:aspect-auto sm:h-14 sm:w-20 sm:shrink-0">
                  {request.studioImage ? (
                    <Image
                      src={request.studioImage}
                      alt={request.studioTitle ?? "Booking request"}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate font-medium text-foreground">
                      {request.studioTitle ?? "Booking request"}
                    </p>
                    <BookingStatusBadge status={request.status} />
                  </div>
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="size-3.5 text-primary" aria-hidden="true" />
                      {formatBookingDate(request.bookingDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" aria-hidden="true" />
                      {request.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" aria-hidden="true" />
                      {request.guests} {request.guests === 1 ? "guest" : "guests"}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
