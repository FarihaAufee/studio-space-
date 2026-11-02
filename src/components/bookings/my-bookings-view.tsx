"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock,
  Inbox,
  ServerOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/studios/status-badge";
import type { BookingRecord } from "@/types/booking";
import { formatBookingDate } from "@/types/booking";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

const TAB_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

/**
 * Booking history for the signed-in user. Data comes from GET
 * /api/bookings/my with browser credentials; status filtering happens
 * client-side so the backend list stays the single source of truth.
 */
export function MyBookingsView() {
  const [bookings, setBookings] = useState<BookingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(true);

  // Shared loader for the retry action (event handlers may set state freely).
  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await parseApiResponse(response);

      if (response.ok) {
        setApiReady(true);
        setBookings((result.data as BookingRecord[]) ?? []);
      } else {
        setApiReady(response.status !== 501);
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
        const response = await fetch(`${API_BASE_URL}/bookings/my`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await parseApiResponse(response);
        if (cancelled) return;

        if (response.ok) {
          setApiReady(true);
          setBookings((result.data as BookingRecord[]) ?? []);
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
  }, []);

  /** Upcoming bookings keep their pending/confirmed state. */
  const activeBookings = useMemo(
    () =>
      (bookings ?? []).filter(
        (booking) => booking.status === "pending" || booking.status === "confirmed"
      ),
    [bookings]
  );

  const renderBookingCard = (booking: BookingRecord) => (
    <Link
      key={booking._id}
      href={`/booking/${booking._id}`}
      className="group flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-[0_2px_24px_rgba(37,42,36,0.05)] transition-shadow hover:shadow-[0_10px_32px_rgba(37,42,36,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:flex-row sm:items-center"
      aria-label={`Open booking details for ${booking.studioTitle ?? "your booking"}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-auto sm:h-24 sm:w-36 sm:shrink-0">
        {booking.studioImage ? (
          <Image
            src={booking.studioImage}
            alt={booking.studioTitle ?? "Booked studio"}
            fill
            sizes="(min-width: 640px) 144px, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg leading-snug tracking-tight">
            {booking.studioTitle ?? "Studio booking"}
          </h2>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
            {formatBookingDate(booking.bookingDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden="true" />
            {booking.timeSlot}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" aria-hidden="true" />
            {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
          </span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:flex"
      >
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {apiReady ? (
            <ServerOff className="size-5" aria-hidden="true" />
          ) : (
            <CircleAlert className="size-5" aria-hidden="true" />
          )}
        </span>
        <p className="font-heading text-2xl tracking-tight">
          Bookings could not be loaded
        </p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {apiReady
            ? error
            : "The booking API does not accept authenticated requests yet — it activates automatically once the backend connects to Better Auth. Your booking history will appear here."}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            void loadBookings();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl tracking-tight">No bookings yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          When you reserve a studio your booking history and statuses will show
          up here.
        </p>
        <Button render={<Link href="/studios" />}>Browse studios</Button>
      </div>
    );
  }

  const countFor = (filter: (typeof TAB_FILTERS)[number]) =>
    filter === "all"
      ? bookings.length
      : bookings.filter((booking) => booking.status === filter).length;

  return (
    <Tabs defaultValue="all" className="gap-6">
      <TabsList className="flex flex-wrap justify-start rounded-full border border-border bg-card p-1 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
        {TAB_FILTERS.map((filter) => (
          <TabsTrigger
            key={filter}
            value={filter}
            className="rounded-full px-4 capitalize"
          >
            {filter}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[0.65rem] text-muted-foreground">
              {countFor(filter)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_FILTERS.map((filter) => {
        const filtered =
          filter === "all"
            ? bookings
            : bookings.filter((booking) => booking.status === filter);

        return (
          <TabsContent key={filter} value={filter} className="flex flex-col gap-4">
            {filter === "all" && activeBookings.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {activeBookings.length} upcoming{" "}
                {activeBookings.length === 1 ? "booking" : "bookings"} awaiting
                your session.
              </p>
            ) : null}
            {filtered.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
                No {filter === "all" ? "" : `${filter} `}bookings yet.
              </p>
            ) : (
              filtered.map(renderBookingCard)
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
