"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Inbox,
  Mail,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/studios/status-badge";
import { StudioImage } from "@/components/studios/studio-image";
import type { BookingRecord } from "@/types/booking";
import { formatBookingDate } from "@/types/booking";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Host inbox for incoming booking requests. Loads GET /api/bookings/requests
 * with browser credentials, then drives the PATCH approve/reject endpoints
 * per request. Requires host access — 403 responses keep a pointer to the
 * Become a Host onboarding visible.
 */
export function BookingRequestsView() {
  const [requests, setRequests] = useState<BookingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
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
        setForbidden(false);
        setError(null);
        setRequests((result.data as BookingRecord[]) ?? []);
      } else {
        setForbidden(response.status === 403);
        setError(result.message);
      }
    } catch {
      setForbidden(false);
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
          setForbidden(false);
          setError(null);
          setRequests((result.data as BookingRecord[]) ?? []);
        } else {
          setForbidden(response.status === 403);
          setError(result.message);
        }
      } catch {
        if (cancelled) return;
        setForbidden(false);
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

  // Error / not-host state — 403 keeps the onboarding path visible.
  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Host access required
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Booking requests arrive from guests who booked the studios you
          listed. Complete the Become a Host onboarding to receive them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/become-a-host" />}>
            Become a Host
          </Button>
          <Button variant="outline" onClick={() => {
            setLoading(true);
            setError(null);
            setForbidden(false);
            void loadRequests();
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (error || !requests) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Requests could not be loaded
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            setError(null);
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
            <StudioImage
              src={request.studioImage}
              alt={request.studioTitle ?? "Booking request"}
              sizes="144px"
              compact
              label={false}
            />
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
