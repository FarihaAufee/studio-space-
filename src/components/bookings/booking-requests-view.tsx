"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Ban,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Hourglass,
  Mail,
  PlugZap,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/studios/status-badge";
import type { BookingRecord } from "@/types/booking";
import { formatBookingDate } from "@/types/booking";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Host inbox for incoming booking requests.
 *
 * The StudioSpace backend does not expose a "bookings awaiting host action"
 * endpoint yet (booking routes cover the guest side only), so the page loads
 * from GET /api/bookings/requests — a reserved integration point. Until that
 * endpoint exists the page shows a clear, honest setup card instead of fake
 * requests, and approve/reject actions call the matching PATCH endpoints so
 * the wiring lights up the moment the backend ships them.
 */
export function BookingRequestsView() {
  const [requests, setRequests] = useState<BookingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [endpointExists, setEndpointExists] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Shared loader for the retry action (event handlers may set state freely).
  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/requests`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await parseApiResponse(response);

      if (response.ok) {
        setEndpointExists(true);
        setRequests((result.data as BookingRecord[]) ?? []);
      } else {
        // 404 — endpoint not part of the backend yet; 501 — auth not wired.
        setEndpointExists(response.status !== 404);
        setError(result.message);
      }
    } catch {
      setEndpointExists(false);
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
        const response = await fetch(`${API_BASE_URL}/bookings/requests`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setEndpointExists(true);
          setRequests((result.data as BookingRecord[]) ?? []);
        } else {
          setEndpointExists(response.status !== 404);
          setError(result.message);
        }
      } catch {
        if (cancelled) return;
        setEndpointExists(false);
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

  const handleDecision = async (
    booking: BookingRecord,
    decision: "approve" | "reject"
  ) => {
    setProcessingId(booking._id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking._id}/${decision}`,
        { method: "PATCH", credentials: "include" }
      );
      const result = await parseApiResponse(response);

      if (response.ok) {
        const updated = (result.data as BookingRecord) ?? null;
        setRequests((current) =>
          current
            ? updated
              ? current.map((item) =>
                  item._id === booking._id
                    ? { ...item, status: updated.status }
                    : item
                )
              : current
            : current
        );
        toast.success(
          decision === "approve"
            ? "Request approved — the guest will be notified."
            : "Request rejected — the guest will be notified."
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  // Backend integration not available yet — keep it explicit and honest.
  if (error || !requests) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PlugZap className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-2xl tracking-tight">
              Host inbox is ready — one endpoint away
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              This dashboard is wired to the backend but the endpoints it needs
              are not live yet.
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {endpointExists
            ? error
            : "No host-side booking API is published yet, so there are no requests to show. Nothing is being faked: when the endpoints below exist, this page loads and manages incoming requests automatically."}
        </p>

        <ul className="flex w-full flex-col gap-2.5 rounded-2xl border border-border bg-muted/50 p-4 text-sm">
          <li className="flex items-center gap-2.5">
            <Hourglass className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <code className="text-xs">GET /api/bookings/requests</code>
            <span className="text-muted-foreground">— pending requests for your studios</span>
          </li>
          <li className="flex items-center gap-2.5">
            <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <code className="text-xs">PATCH /api/bookings/:id/approve</code>
            <span className="text-muted-foreground">— confirm a request</span>
          </li>
          <li className="flex items-center gap-2.5">
            <X className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <code className="text-xs">PATCH /api/bookings/:id/reject</code>
            <span className="text-muted-foreground">— decline a request</span>
          </li>
        </ul>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          Guest-side booking pages are live — approve/reject keeps working once
          hosted sessions arrive.
        </p>

        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            void loadRequests();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
        No pending booking requests right now. New requests for your studios
        will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <article
          key={request._id}
          className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:flex-row sm:items-center sm:p-5"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-auto sm:h-24 sm:w-36 sm:shrink-0">
            {request.studioImage ? (
              <Image
                src={request.studioImage}
                alt={request.studioTitle ?? "Booking request"}
                fill
                sizes="144px"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg leading-snug tracking-tight">
                {request.studioTitle ?? "Booking request"}
              </h2>
              <BookingStatusBadge status={request.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
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
              <span className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-3.5 text-primary" aria-hidden="true" />
                <span className="truncate">{request.email}</span>
              </span>
            </div>
            {request.notes ? (
              <p className="truncate text-xs text-muted-foreground">
                “{request.notes}”
              </p>
            ) : null}
          </div>

          {request.status === "pending" ? (
            <div className="flex items-center gap-2 sm:shrink-0">
              <Button
                size="sm"
                disabled={processingId === request._id}
                onClick={() => void handleDecision(request, "approve")}
              >
                <Check className="size-3.5" /> Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={processingId === request._id}
                onClick={() => void handleDecision(request, "reject")}
              >
                <Ban className="size-3.5" /> Reject
              </Button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
