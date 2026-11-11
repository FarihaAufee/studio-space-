import type { Metadata } from "next";
import Link from "next/link";

// Cache Components migration: this route reads `searchParams` (the ?error=
// OAuth failure code) and must block on the server — see
// nextjs.org/docs/app/guides/instant-navigation#opting-out
export const instant = false;

export const metadata: Metadata = {
  title: "Sign-in error — StudioSpace",
};

interface ErrorContent {
  title: string;
  message: string;
  /** Optional hint about what the user can do about it. */
  hint?: string;
}

/**
 * Maps Better Auth's OAuth callback error codes (redirected here via
 * `onAPIError.errorURL`) to human-readable copy. Unknown codes fall back to a
 * generic message — never widen this to leak internals.
 */
function describeError(code: string | undefined): ErrorContent {
  switch (code) {
    case "account_not_linked":
      return {
        title: "We couldn't match that Google sign-in to your account",
        message:
          "An email/password account already exists for this email, so for your security Google wasn't linked to it automatically. This app doesn't yet send verification emails, which is what automatic linking checks for.",
        hint: "You can connect Google once by signing in with your email and password and opening Connected Accounts on your profile page. After that, Google sign-in will work directly.",
      };
    case "email_does_not_match":
      return {
        title: "That provider account uses a different email",
        message:
          "The email on the account you just signed in with doesn't match your StudioSpace account, so they were not connected.",
        hint: "Sign in with the provider whose email matches your StudioSpace account, or continue with your email and password.",
      };
    case "email_not_verified":
      return {
        title: "Your provider email isn't verified",
        message:
          "Accounts can only be connected when the provider confirms your email address. Please verify your email with the provider and try again.",
      };
    case "oauth_provider_not_found":
      return {
        title: "Sign-in provider isn't configured",
        message:
          "This sign-in method isn't set up yet. Please use another way to sign in.",
      };
    case "state_mismatch":
    case "state_not_found":
    case "state_invalid":
      return {
        title: "That sign-in attempt expired",
        message:
          "We couldn't verify the sign-in request when the provider returned — it may have been started in another tab or left open too long. Nothing was changed on your account.",
        hint: "Close any other sign-in tabs, then start again from the StudioSpace sign-in (or Connect) button. Make sure you complete the flow on the same address this app is open at.",
      };
    case "invalid_code":
      return {
        title: "The provider didn't complete the sign-in",
        message:
          "The authorization from Google/GitHub could not be exchanged, so no sign-in happened. This is usually temporary.",
        hint: "Please try again. If it keeps failing, use your email and password to sign in.",
      };
    case "unable_to_link_account":
    case "email_not_found":
      return {
        title: "We couldn't connect that provider account",
        message:
          "Accounts can only be connected when the provider confirms a verified email that matches your StudioSpace account.",
        hint: "Verify your email with the provider, then connect it again from Connected Accounts on your profile page.",
      };
    default:
      return {
        title: "Sign-in failed",
        message:
          "We couldn't complete the sign-in. Please try again, or continue with your email and password.",
      };
  }
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const { title, message, hint } = describeError(params.error);

  return (
    <div className="container-page flex flex-col items-center py-24 md:py-32">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-10">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Sign-in error
        </p>
        <h1 className="mt-4 font-heading text-2xl tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {hint ? (
          <p className="mt-4 rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/login"
            className="flex h-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-full border border-border text-sm font-medium transition-colors hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
