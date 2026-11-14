"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";

const inputClasses =
  "h-11 w-full rounded-full border border-input bg-card px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-50";

interface AuthFormProps {
  mode: "login" | "register";
  /**
   * Same-origin path to return to after a successful sign-in (e.g. the
   * Become a Host onboarding, reached through /login?next=…). Defaults to
   * the home page. Social sign-in uses it as its callback URL.
   */
  redirectTarget?: string;
  /** Shows a small notice when the user was sent here from a gated page. */
  showReturnNotice?: boolean;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.68-.06-1.36-.19-2.02H12v3.82h5.4a4.63 4.63 0 0 1-2 3.04v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.34Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.06.96-3.39.96-2.6 0-4.8-1.76-5.6-4.12H3.07v2.6A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        d="M6.4 13.9a6 6 0 0 1 0-3.8v-2.6H3.07a10 10 0 0 0 0 9l3.33-2.6Z"
      />
      <path
        fill="currentColor"
        d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a9.99 9.99 0 0 0-8.93 5.5l3.33 2.6C7.2 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.33 1.11 2.9.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.02-2.75-.1-.26-.44-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.54 1.41.2 2.45.1 2.71.63.72 1.02 1.63 1.02 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

/**
 * Shared login / register form.
 *
 * Sign-up and sign-in go through Better Auth (email/password), with Google
 * and GitHub social sign-in buttons on top.
 */
export function AuthForm({ mode, redirectTarget, showReturnNotice }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] = useState<"google" | "github" | null>(null);

  const afterAuth = redirectTarget ?? "/";

  /**
   * Carry the return target across the login/register switch so a visitor
   * bounced from a gated page does not lose it by switching modes. Auth
   * pages themselves are never carried as targets.
   */
  const carryNext =
    redirectTarget &&
    redirectTarget !== "/" &&
    !redirectTarget.startsWith("/login") &&
    !redirectTarget.startsWith("/register")
      ? `?next=${encodeURIComponent(redirectTarget)}`
      : "";
  const switchHref = isRegister
    ? `/login${carryNext}`
    : `/register${carryNext}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setSubmitting(true);
    try {
      const { error } = isRegister
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (error) {
        toast.error(error.message || "Something went wrong. Please try again.");
        return;
      }

      toast.success(
        isRegister ? "Account created. Welcome to StudioSpace!" : "Signed in. Welcome back!"
      );
      router.push(afterAuth);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (provider: "google" | "github") => {
    setSocialProvider(provider);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: afterAuth,
      });

      if (error) {
        toast.error(
          error.message ||
            (provider === "google"
              ? "Google sign-in is not configured yet."
              : "GitHub sign-in is not configured yet.")
        );
        setSocialProvider(null);
      }
      // On success the browser is redirected to the provider, so there is
      // nothing else to do here.
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSocialProvider(null);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_2px_24px_rgba(37,42,36,0.05)] sm:p-10">
      <div className="flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-7 font-heading text-3xl tracking-tight">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRegister
            ? "Book studios as a creator, or list your own space as a host."
            : "Sign in to manage your bookings and studio listings."}
        </p>
        {showReturnNotice && redirectTarget ? (
          <p className="mt-4 rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Sign in and we will take you straight back to{" "}
            <span className="font-medium text-foreground">{redirectTarget}</span>.
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={submitting || socialProvider !== null}
          onClick={() => handleSocial("google")}
        >
          <GoogleIcon />
          {socialProvider === "google" ? "Redirecting to Google…" : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={submitting || socialProvider !== null}
          onClick={() => handleSocial("github")}
        >
          <GitHubIcon />
          {socialProvider === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="auth-name"
              className="pl-4 text-sm font-medium text-foreground"
            >
              Full name
            </label>
            <input
              id="auth-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jordan Smith"
              className={inputClasses}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="auth-email"
            className="pl-4 text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="auth-password"
            className="pl-4 text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="••••••••"
            className={inputClasses}
          />
          {isRegister && (
            <p className="pl-4 text-xs text-muted-foreground">
              Must be at least 8 characters.
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={submitting || socialProvider !== null} className="mt-2">
          {submitting
            ? isRegister
              ? "Creating account…"
              : "Signing in…"
            : isRegister
              ? "Create Account"
              : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        By continuing you agree to our terms of service and privacy policy.
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to StudioSpace?"}{" "}
        <Link
          href={switchHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
