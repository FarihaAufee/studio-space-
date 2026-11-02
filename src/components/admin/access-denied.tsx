import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when an authenticated user without admin privileges opens an /admin
 * page. Authorization also enforced server-side; this screen mirrors 403.
 */
export function AdminAccessDenied() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="size-5" aria-hidden="true" />
          </span>
          <p className="font-heading text-2xl tracking-tight">Access denied</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This area is restricted to StudioSpace administrators. Your account
            is signed in, but it is not on the admin allow-list.
          </p>
          <Button variant="outline" render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}
