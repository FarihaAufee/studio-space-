import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/app/studios/studios";

/**
 * Booking status pill. Colors are literal hex pairs (not theme tokens) so
 * each status keeps an explicit, accessible foreground/background pairing
 * in both light and dark mode.
 */
const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-[#B45309]/10 text-[#B45309] dark:text-[#FBBF24]",
    dot: "bg-[#B45309] dark:bg-[#FBBF24]",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-[#2F7D4F]/10 text-[#2F7D4F] dark:text-[#6EE7A0]",
    dot: "bg-[#2F7D4F] dark:bg-[#6EE7A0]",
  },
  completed: {
    label: "Completed",
    className:
      "bg-[#252A24]/10 text-[#252A24] dark:bg-white/10 dark:text-[#F7F5EF]",
    dot: "bg-[#252A24] dark:bg-[#F7F5EF]",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config =
    STATUS_STYLES[status as BookingStatus] ?? STATUS_STYLES.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", config.dot)}
      />
      {config.label}
    </span>
  );
}
