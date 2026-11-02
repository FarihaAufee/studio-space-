"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

/**
 * Sonner toaster wired to the StudioSpace theme tokens so toasts
 * match popover styling in both light and dark mode.
 */
export function Toaster(props: ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position="bottom-right"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-border font-sans text-foreground shadow-lg",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
