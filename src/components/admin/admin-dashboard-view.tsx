"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CircleAlert,
  Images,
  MapPinned,
  RotateCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Admin dashboard stats. Every number streams from
 * GET /api/admin/stats (requireAuth + requireAdmin) — real MongoDB counts,
 * never fabricated. HTTP statuses surface honestly: 401 for a dead session,
 * 403 for a non-admin account.
 */

interface AdminStats {
  totalStudios: number;
  totalUsers: number;
  totalBookings: number;
}

const STAT_CARDS = [
  {
    key: "totalStudios" as const,
    label: "Total studios",
    icon: Images,
    description: "All studios in the database, including legacy and demo ones.",
    href: "/admin/studios",
    cta: "Manage studios",
  },
  {
    key: "totalUsers" as const,
    label: "Total users",
    icon: Users,
    description: "Better Auth accounts registered on StudioSpace.",
    href: null,
    cta: null,
  },
  {
    key: "totalBookings" as const,
    label: "Total bookings",
    icon: CalendarCheck,
    description: "Booking requests created by users so far.",
    href: null,
    cta: null,
  },
];

export function AdminDashboardView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    setReloadKey((key) => key + 1);
  };

  // Mount-time load (re-run after retries): an async IIFE with a race guard
  // so no setState runs synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setStats((result.data as AdminStats) ?? null);
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

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-[0_2px_24px_rgba(37,42,36,0.05)]"
          >
            <Skeleton className="size-11 rounded-2xl" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
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
          {unauthorized ? "Admin session expired" : "Stats could not be loaded"}
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {unauthorized
            ? "Your admin access could not be verified. Please sign in again with an admin account."
            : error}
        </p>
        <Button variant="outline" onClick={retry}>
          <RotateCw className="size-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map((card) => {
          const value = stats?.[card.key];
          const Icon = card.icon;
          return (
            <article
              key={card.key}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {card.label}
              </p>
              <p className="font-heading text-4xl leading-none tracking-tight">
                {value !== undefined && value !== null ? (
                  value.toLocaleString("en-US")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
              {card.href ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 self-start"
                  render={<Link href={card.href} />}
                >
                  <MapPinned className="size-4" /> {card.cta}
                </Button>
              ) : null}
            </article>
          );
        })}
      </div>

      {/* Management shortcuts */}
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="font-heading text-xl tracking-tight">
            Studio management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter, edit, or delete any studio — including demo and
            legacy listings.
          </p>
        </div>
        <Button className="shrink-0" render={<Link href="/admin/studios" />}>
          <Images className="size-4" /> Open studio list
        </Button>
      </div>
    </div>
  );
}
