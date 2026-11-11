"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Ban,
  CalendarDays,
  CircleAlert,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ServerOff,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/components/studios/status-badge";
import { StudioImage } from "@/components/studios/studio-image";
import type { BookingRecord } from "@/types/booking";
import { formatBookingDate, formatTimestamp } from "@/types/booking";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

/**
 * Booking detail page body (client-side because every booking endpoint
 * requires browser credentials). Renders the studio snapshot, the session
 * details, price summary, and the cancel action for pending/confirmed
 * bookings. Backend responses that say authentication is not connected yet
 * surface verbatim — no fabricated booking state.
 */
export function BookingDetailView({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(true);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Shared loader used by the retry action (an event handler, where
  // synchronous `setLoading(true)` is safe). The mount-time effect below
  // performs the initial fetch itself with a race guard.
  const loadBooking = useCallback(
    async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);

        if (response.ok) {
          setApiReady(true);
          setBooking(result.data as BookingRecord);
        } else {
          setApiReady(response.status !== 501);
          setError(result.message);
        }
      } catch {
        setError("We could not reach the StudioSpace API. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [bookingId]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setApiReady(true);
          setBooking(result.data as BookingRecord);
        } else {
          setApiReady(response.status !== 501);
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
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking._id}/cancel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ cancelReason: cancelReason.trim() || undefined }),
        }
      );
      const result = await parseApiResponse(response);

      if (response.ok) {
        setBooking((result.data as BookingRecord) ?? booking);
        setCancelOpen(false);
        setCancelReason("");
        toast.success("Booking cancelled.");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {apiReady ? (
            <CircleAlert className="size-5" aria-hidden="true" />
          ) : (
            <ServerOff className="size-5" aria-hidden="true" />
          )}
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Booking could not be loaded
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {error}{" "}
          {!apiReady &&
            "The booking API activates once the backend connects to Better Auth."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              void loadBooking();
            }}
          >
            Try again
          </Button>
          <Button variant="ghost" render={<Link href="/my-bookings" />}>
            Back to my bookings
          </Button>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left column: studio snapshot + session details */}
      <div className="flex min-w-0 flex-col gap-6">
        {/* Studio snapshot */}
        <Card className="overflow-hidden rounded-3xl border-border/70 py-0 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted sm:aspect-[2/1]">
            <StudioImage
              src={booking.studioImage}
              alt={booking.studioTitle ?? "Booked studio"}
              sizes="(min-width: 1024px) 56rem, 100vw"
            />
          </div>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <h2 className="font-heading text-xl tracking-tight">
                {booking.studioTitle ?? "Studio booking"}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {booking.studioLocation ?? "StudioSpace"}
              </p>
            </div>
            {booking.studioId && (
              <Button variant="outline" size="sm" render={<Link href={`/studios/${booking.studioId}`} />}>
                View studio
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Session details grid */}
        <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
          <h2 className="font-heading text-xl tracking-tight">Session details</h2>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-4.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Date</p>
                <p className="text-[0.9375rem]">{formatBookingDate(booking.bookingDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Clock className="size-4.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Time slot</p>
                <p className="text-[0.9375rem]">{booking.timeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Users className="size-4.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Guests</p>
                <p className="text-[0.9375rem]">{booking.guests}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="size-4.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Contact</p>
                <p className="text-[0.9375rem]">{booking.fullName}</p>
                <p className="flex items-center gap-1.5 break-words text-sm text-muted-foreground">
                  <Mail className="size-3" aria-hidden="true" />
                  {booking.email}
                </p>
                {booking.phone ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="size-3" aria-hidden="true" />
                    {booking.phone}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {booking.notes ? (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-4.5 text-muted-foreground" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Notes for the host</p>
                  <p className="text-[0.9375rem] leading-relaxed">{booking.notes}</p>
                </div>
              </div>
            </>
          ) : null}

          {booking.status === "cancelled" && booking.cancelReason ? (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Cancellation reason</p>
                <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{booking.cancelReason}</p>
              </div>
            </>
          ) : null}
        </section>
      </div>

      {/* Right column: price summary + status + actions */}
      <aside className="flex flex-col gap-6" aria-label="Booking summary">
        <Card className="gap-5 rounded-3xl border-border/70 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl tracking-tight">Booking status</h2>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="flex flex-col gap-2.5 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" aria-hidden="true" />
                  Booked by
                </span>
                <span className="max-w-[10rem] truncate font-medium text-foreground">
                  {booking.fullName}
                </span>
              </div>
              {booking.hourlyRate !== undefined ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" aria-hidden="true" />
                    Studio rate
                  </span>
                  <span className="font-medium text-foreground">
                    ৳{booking.hourlyRate} / hour
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Security deposit
                </span>
                <span className="font-medium text-foreground">
                  ৳{booking.securityDeposit ?? 0}
                </span>
              </div>
            </div>

            {booking.createdAt ? (
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                Booked on {formatTimestamp(booking.createdAt)}
              </p>
            ) : null}

            {canCancel ? (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="size-4" /> Cancel booking
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </aside>

      {/* Cancel dialog with optional reason (backend stores cancelReason) */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl tracking-tight">
              Cancel this booking?
            </DialogTitle>
            <DialogDescription>
              The time slot will be released and the studio becomes
              available again. You can share a reason with the host — it is
              optional.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-reason" className="pl-4">
              Reason (optional)
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="e.g. Shoot postponed by the client."
              className="min-h-20 rounded-2xl border-border bg-card px-4 py-3"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={cancelling} onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={cancelling}
              onClick={() => void handleCancel()}
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
