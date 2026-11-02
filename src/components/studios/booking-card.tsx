"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarCheck,
  Clock,
  CircleAlert,
  Info,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";

interface BookingCardProps {
  /** The studio being booked — required by the backend create API. */
  studioId: string;
  studioTitle: string;
  hourlyRate: number;
  securityDeposit?: number;
  maxCapacity?: number;
}

const inputClasses =
  "h-11 w-full rounded-full border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-60";

const numClasses =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

/**
 * Booking panel on the studio details page.
 *
 * Full booking experience: date, start time, duration, guests, customer
 * information and a live price summary. Signed-in visitors submit through
 * the backend's POST /api/bookings with browser credentials; the server
 * stamps the booking owner from its authenticated session. Until backend
 * auth is live the API responds 501 and the card shows that honestly
 * instead of pretending the booking succeeded.
 */
export function BookingCard({
  studioId,
  studioTitle,
  hourlyRate,
  securityDeposit,
  maxCapacity,
}: BookingCardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user ?? null;

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState("2");
  const [guests, setGuests] = useState("1");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const deposit = securityDeposit ?? 0;
  const hasCapacityLimit = typeof maxCapacity === "number" && maxCapacity > 0;

  /** timeSlot string for the backend: "10:00 - 12:00". */
  const timeSlot = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
    const duration = Math.max(1, Math.min(12, Number(hours) || 0));
    const endMinutes = h * 60 + m + duration * 60;
    const endH = Math.floor((endMinutes % 1440) / 60);
    const endM = endMinutes % 60;
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${pad(h)}:${pad(m)} - ${pad(endH)}:${pad(endM)}`;
  }, [startTime, hours]);

  const hoursNum = Number(hours);
  const guestsNum = Number(guests);
  const estimatedTotal = Number.isFinite(hoursNum)
    ? hourlyRate * Math.max(0, hoursNum) + deposit
    : null;

  // Session details prefill the customer information once resolved.
  const linkedFullName = fullName || sessionUser?.name || "";
  const linkedEmail = email || sessionUser?.email || "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    // ---- Local validation (mirrors backend booking rules) ----
    if (!bookingDate) {
      toast.error("Please choose a booking date.");
      return;
    }
    const chosenDate = new Date(`${bookingDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosenDate < today) {
      toast.error("Please choose a date in the future.");
      return;
    }
    if (!startTime) {
      toast.error("Please choose a start time.");
      return;
    }
    if (!Number.isFinite(hoursNum) || hoursNum < 1 || hoursNum > 12) {
      toast.error("Session length must be between 1 and 12 hours.");
      return;
    }
    if (!Number.isFinite(guestsNum) || guestsNum < 1) {
      toast.error("Please add at least one guest.");
      return;
    }
    if (hasCapacityLimit && guestsNum > maxCapacity) {
      toast.error(`This studio hosts up to ${maxCapacity} guests.`);
      return;
    }
    if (!linkedFullName.trim() || !linkedEmail.trim()) {
      toast.error("Your name and email are required to request a booking.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studioId,
          bookingDate,
          timeSlot,
          guests: guestsNum,
          fullName: linkedFullName.trim(),
          email: linkedEmail.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const result = await parseApiResponse(response);

      if (!response.ok) {
        // The backend responds 501 until Better Auth is connected there —
        // surface that verbatim instead of inventing a confirmation.
        setNotice(result.message);
        toast.error(result.message);
        return;
      }

      const created = result.data as { _id?: string } | null;
      toast.success("Booking requested! You can follow it in My Bookings.");
      if (created?._id) {
        router.push(`/booking/${created._id}`);
      } else {
        router.push("/my-bookings");
      }
    } catch {
      setNotice("We could not reach the StudioSpace API. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Signed-out visitors get a concise sign-in prompt, not a dead form. */
  if (!isPending && !sessionUser) {
    return (
      <Card className="gap-5 rounded-3xl border-border/70 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl tracking-tight">
            ৳{hourlyRate}
            <span className="text-sm font-normal text-muted-foreground"> / hour</span>
          </CardTitle>
          <CardDescription>
            Reserve {studioTitle} for your next session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <Info className="mr-2 inline size-4 text-primary" aria-hidden="true" />
            Booking requires a StudioSpace account so hosts know who is coming
            and your session history stays in one place.
          </p>
          <Button size="lg" render={<Link href="/login" />}>
            <CalendarCheck className="size-4" aria-hidden="true" />
            Sign in to book
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-5 rounded-3xl border-border/70 shadow-[0_2px_24px_rgba(37,42,36,0.05)] lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="font-heading text-3xl tracking-tight">
          ৳{hourlyRate}
          <span className="text-sm font-normal text-muted-foreground"> / hour</span>
        </CardTitle>
        <CardDescription>
          Reserve {studioTitle} for your next session.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {notice && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-relaxed text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          aria-label="Book this studio"
        >
          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-date" className="pl-3 text-xs">
                Date
              </Label>
              <input
                id="booking-date"
                type="date"
                className={`${inputClasses} [color-scheme:light] dark:[color-scheme:dark]`}
                value={bookingDate}
                onChange={(event) => setBookingDate(event.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-start" className="pl-3 text-xs">
                Start time
              </Label>
              <input
                id="booking-start"
                type="time"
                className={`${inputClasses} [color-scheme:light] dark:[color-scheme:dark]`}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-hours" className="pl-3 text-xs">
                Duration (hours)
              </Label>
              <input
                id="booking-hours"
                type="number"
                min={1}
                max={12}
                className={`${inputClasses} ${numClasses}`}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-guests" className="pl-3 text-xs">
                Guests{hasCapacityLimit ? ` (max ${maxCapacity})` : ""}
              </Label>
              <input
                id="booking-guests"
                type="number"
                min={1}
                max={hasCapacityLimit ? maxCapacity : undefined}
                className={`${inputClasses} ${numClasses}`}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                required
              />
            </div>
          </div>

          {/* Customer information (prefilled from the signed-in account) */}
          <div className="flex flex-col gap-3">
            <p className="pl-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Your details
            </p>
            <div className="flex flex-col gap-3">
              <Label htmlFor="booking-name" className="sr-only">
                Full name
              </Label>
              <input
                id="booking-name"
                type="text"
                autoComplete="name"
                placeholder="Full name"
                className={inputClasses}
                value={linkedFullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
              <Label htmlFor="booking-email" className="sr-only">
                Email
              </Label>
              <input
                id="booking-email"
                type="email"
                autoComplete="email"
                placeholder="Email for confirmations"
                className={inputClasses}
                value={linkedEmail}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Label htmlFor="booking-phone" className="sr-only">
                Phone (optional)
              </Label>
              <input
                id="booking-phone"
                type="tel"
                autoComplete="tel"
                placeholder="Phone (optional)"
                className={inputClasses}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Label htmlFor="booking-notes" className="sr-only">
                Notes (optional)
              </Label>
              <textarea
                id="booking-notes"
                placeholder="Notes for the host — gear, setup, purpose (optional)"
                rows={2}
                maxLength={1000}
                className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Price summary */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />
                Session ({timeSlot || "choose a time"})
              </span>
              <span className="font-medium text-foreground">
                ৳{hourlyRate} / hour
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                {guests || 1} {Number(guests || 1) === 1 ? "guest" : "guests"}
                {hasCapacityLimit ? ` of up to ${maxCapacity}` : ""}
              </span>
              <span className="font-medium text-foreground">
                {Number.isFinite(hoursNum) ? `৳${hourlyRate * Math.max(0, hoursNum)}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Refundable security deposit
              </span>
              <span className="font-medium text-foreground">৳{deposit}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="font-heading text-lg">Estimated total</span>
              <span className="font-heading text-xl text-foreground">
                {estimatedTotal === null ? "—" : `৳${estimatedTotal}`}
              </span>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={submitting || isPending}>
            <CalendarCheck className="size-4" aria-hidden="true" />
            {submitting ? "Sending request…" : "Request to Book"}
          </Button>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            Requests are reviewed by the host before confirmation. The deposit
            is refunded after the session when the space is left as found.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="size-3.5" aria-hidden="true" />
            Booking as {linkedFullName || "your account"}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
