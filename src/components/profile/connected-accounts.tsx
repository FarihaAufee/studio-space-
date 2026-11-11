"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

/**
 * "Connected accounts" — explicit OAuth account linking.
 *
 * Better Auth deliberately refuses to auto-link an OAuth identity into an
 * existing Email/Password account during sign-in unless the local user is
 * email-verified too (this app sends no verification email yet, which is what
 * caused the `account_not_linked` redirect). The supported solution is the
 * explicit flow: an already-authenticated user calls `linkSocial()`, proves
 * ownership of the password account by being signed in, and Better Auth then
 * verifies the provider's `email_verified` claim AND requires the same email
 * before creating the link.
 *
 * After this one-time link, social sign-in for that provider succeeds
 * directly against the stored provider account.
 */

type ProviderId = "google" | "github";

interface ProviderRow {
  id: ProviderId;
  name: string;
  icon: React.ReactNode;
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

/** Only OAuth-style providers can be linked/unlinked — password isn't unlinkable. */
const PROVIDERS: ProviderRow[] = [
  { id: "google", name: "Google", icon: <GoogleIcon /> },
  { id: "github", name: "GitHub", icon: <GitHubIcon /> },
];

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<Map<ProviderId, string> | null>(null);
  const [busyProvider, setBusyProvider] = useState<ProviderId | null>(null);

  /** Fetches the session user's OAuth account rows; resolves null on errors. */
  const fetchAccounts = useCallback(async (): Promise<Map<ProviderId, string> | null> => {
    const { data, error } = await authClient.listAccounts();
    if (error) {
      // Missing auth context etc. — keep whatever is on screen.
      return null;
    }
    // 1.7's /unlink-account takes the Better Auth account ID (not the
    // provider name), so remember each OAuth account's row ID.
    const next = new Map<ProviderId, string>();
    for (const account of data ?? []) {
      if (account.providerId === "google" || account.providerId === "github") {
        next.set(account.providerId, account.id);
      }
    }
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Mirrors the host-status probe in profile-view: one microtask first so
    // the initial render settles, then the network read.
    Promise.resolve().then(() => fetchAccounts()).then((next) => {
      if (cancelled) return;
      if (next) setAccounts(next);
    }).catch(() => {
      // Network failure keeps the loading state visible.
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAccounts]);

  const handleLink = async (provider: ProviderRow) => {
    setBusyProvider(provider.id);
    // Redirects to the provider, then back to /profile once linked (or to
    // /auth-error when the claim is rejected — e.g. a different email).
    const { error } = await authClient.linkSocial({
      provider: provider.id,
      callbackURL: "/profile",
    });
    if (error) {
      toast.error(error.message || `Could not start connecting ${provider.name}.`);
      setBusyProvider(null);
    }
    // On success the browser leaves for the provider — nothing else to do.
  };

  const handleUnlink = async (provider: ProviderRow) => {
    const accountId = accounts?.get(provider.id);
    if (!accountId) return;
    setBusyProvider(provider.id);
    // 1.7's /unlink-account sits behind fresh-session middleware (a session
    // younger than `session.freshAge`, default 24 h) and needs the Better
    // Auth account ID (not the provider name).
    const { error } = await authClient.unlinkAccount({ accountId });
    if (error) {
      if (/last/i.test(error.message ?? "")) {
        toast.error(
          "This provider is your only way to sign in, so it can't be disconnected."
        );
      } else if (
        /fresh/i.test(error.message ?? "") ||
        error.status === 403
      ) {
        toast.error(
          "For security, please sign out and sign in again, then try disconnecting."
        );
      } else {
        toast.error(error.message || `Could not disconnect ${provider.name}.`);
      }
    } else {
      toast.success(`${provider.name} disconnected.`);
    }
    await fetchAccounts().then((next) => {
      if (next) setAccounts(next);
    });
    setBusyProvider(null);
  };

  if (accounts === null) {
    return (
      <section
        className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
        aria-label="Connected accounts"
      >
        <Spinner className="size-4" /> Loading connected accounts…
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Connected accounts">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-heading text-lg font-medium">Connected Accounts</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Connect Google or GitHub to sign in with them directly. The provider
        must use the same verified email as your account.
      </p>
      <div className="flex flex-col gap-2.5">
        {PROVIDERS.map((provider) => {
          const isLinked = accounts.has(provider.id);
          const isBusy = busyProvider === provider.id;
          // The stored password always remains a sign-in method, so
          // disconnecting a provider never locks the user out.
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
            >
              <div className="flex items-center gap-2.5 text-sm">
                {provider.icon}
                <span>{provider.name}</span>
                <span className="text-muted-foreground">
                  {isLinked ? "Connected" : "Not connected"}
                </span>
              </div>
              {isLinked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleUnlink(provider)}
                  disabled={busyProvider !== null}
                >
                  {isBusy ? <Spinner className="size-4" /> : "Disconnect"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLink(provider)}
                  disabled={busyProvider !== null}
                >
                  {isBusy ? (
                    <>
                      <Spinner className="size-4" /> Connecting…
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
