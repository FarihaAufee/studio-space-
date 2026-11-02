import Link from "next/link";
import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

/**
 * StudioSpace wordmark: aperture mark + serif logotype used in the
 * navbar, footer, and auth screens.
 */
export function Logo({
  href = "/",
  className,
  markClassName,
  wordmarkClassName,
  ...props
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="StudioSpace home"
      className={cn(
        "group inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-500 group-hover:rotate-45",
          markClassName
        )}
      >
        <Aperture className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span
        className={cn(
          "font-heading text-2xl leading-none tracking-tight text-foreground",
          wordmarkClassName
        )}
      >
        <span className="font-semibold">Studio</span>
        <span className="font-normal italic">Space</span>
      </span>
    </Link>
  );
}
