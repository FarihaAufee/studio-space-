
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient, mongoDb } from "@/lib/mongodb";

/**
 * Origins the browser may call the auth API from. Better Auth's CSRF check
 * rejects every cookie-bearing POST (sign-out, change-password, …) whose
 * `Origin` header is not in this list, so it must cover every environment
 * the app is actually served from — not just BETTER_AUTH_URL.
 *
 * Sign-out used to fail with 403 INVALID_ORIGIN whenever the page origin
 * differed from BETTER_AUTH_URL (Next dev shifting to port 3001, or the
 * deployed Vercel domain), while sign-in kept working because it sends no
 * session cookie yet.
 */

/** URL string → origin ("https://x.com/app" → "https://x.com"); null if invalid. */
const toOrigin = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const trustedOrigins = [
  // Explicitly configured auth URL (e.g. the production domain on Vercel).
  toOrigin(process.env.BETTER_AUTH_URL),

  // Vercel: the exact domain of the current deployment (covers every preview
  // deployment) and the project's stable production domain.
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,

  // Local development on any port (Next.js shifts to 3001 when 3000 is busy).
  "http://localhost:*",
  "http://127.0.0.1:*",
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  /**
   * Account linking policy (Better Auth 1.7).
   *
   * Problem being solved: an existing Email/Password user who signs in with
   * Google used to hit `account_not_linked`. Better Auth's implicit linking
   * (link-account.mjs) refuses to auto-link unless BOTH sides are
   * email-verified — the IdP claim (Google's signature-verified
   * `email_verified`) AND the local user row (`requireLocalEmailVerified`).
   * This app has no email-verification flow yet, so every password user has
   * `emailVerified: false` and implicit linking was always refused.
   *
   * The safe fix is NOT to lower that flag (`requireLocalEmailVerified: false`
   * is documented as deprecated — it lets an attacker who pre-registers an
   * unverified password account at a victim's email have the victim's OAuth
   * identity linked into the attacker-owned row). Instead we keep the strict
   * implicit-linking defaults and surface an EXPLICIT linking flow in the
   * profile page ("Connected accounts" → authClient.linkSocial()). The
   * explicit path (`/link-social`) already requires authentication with the
   * password first, so it safely relaxes the local-verified requirement while
   * still demanding the provider's `emailVerified === true` and the SAME
   * email (allowDifferentEmails: false). Once linked once, subsequent Google
   * sign-ins match on the stored provider account and succeed directly.
   */
  account: {
    accountLinking: {
      enabled: true,
      // Only provider-email-verified claims count as ownership proof — never
      // blanket-trust a provider by name.
      trustedProviders: [],
      // A Google account with a different email must never silently attach to
      // the signed-in user.
      allowDifferentEmails: false,
    },
  },

  /**
   * OAuth failures redirect here instead of /api/auth/error so users get a
   * human-readable page (see src/app/auth-error/page.tsx) that explains
   * `account_not_linked` and points them at the Connected Accounts UI.
   */
  onAPIError: {
    errorURL: "/auth-error",
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      bio: { type: "string", required: false },
      /**
       * Role field for the StudioSpace multi-role system — "customer" (the
       * default), "host", or "admin".
       *
       * Security: `input: false` blocks clients from setting the value
       * through any Better Auth endpoint. New sign-ups receive the
       * "customer" default; "host" is granted exclusively by the server
       * after successful Become a Host validation (POST /api/hosts/apply)
       * via a direct, session-verified database update; "admin" is only
       * ever assigned manually or through the ADMIN_EMAILS env list
       * (src/lib/admin.ts). A missing role on legacy accounts is treated
       * as "customer" by src/lib/api-server.ts.
       */
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },

    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  trustedOrigins,

  plugins: [nextCookies()],
});