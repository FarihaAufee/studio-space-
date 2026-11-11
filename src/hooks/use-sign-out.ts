"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

/** Where a signed-out user lands. */
const SIGNED_OUT_HREF = "/";

/**
 * Shared logout flow for every "Logout" button (Navbar dropdown, mobile
 * menu, profile view).
 *
 * Always calls the single Better Auth browser client's `signOut()`, which
 * clears the session cookie server-side (via the nextCookies plugin) and
 * resolves with `{ error }` instead of throwing on HTTP failures — so the
 * error must be read from the result, not caught.
 *
 * On success the RSC cache is refreshed so server-rendered, session-aware
 * pages (protected routes, host dashboard, …) re-render with the cleared
 * session, and the user is redirected to the homepage.
 */
export function useSignOut() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(
          error.message ??
            "Something went wrong while signing out. Please try again."
        );
        return;
      }
      toast.success("You have been signed out.");
      router.push(SIGNED_OUT_HREF);
      router.refresh();
    } catch {
      toast.error(
        "Something went wrong while signing out. Please try again."
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return { handleSignOut, isSigningOut };
}
